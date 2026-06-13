import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import * as Sentry from '@sentry/nestjs';
import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Message, PubSub, Subscription, Topic } from '@google-cloud/pubsub';
import { PinoLogger } from 'nestjs-pino';
import { PUBSUB_CLIENT } from './pubsub.provider';

type PubSubOutboundMessage = {
  topic: string;
  orderingKey: string;
  value: string;
};

const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

/**
 * Local lifecycle state for this process's ephemeral Pub/Sub subscription to
 * one logical topic.
 */
type TopicSubscriptionState = {
  // Remote Pub/Sub subscription resource name reused by this process across retries.
  name: string;
  // Current Subscription object bound to Pub Sub resource, if open.
  PubSubSubscription: Subscription | null;
  // Delay, in milliseconds, to use for the next reconnect attempt.
  reconnectDelayMs: number;
  // Scheduled local timer that will trigger the next reconnect attempt, if any.
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  // Prevents overlapping open/reopen work for the same topic in this process.
  opening: boolean;
};

/**
 * Contract implemented by feature-level Pub/Sub topic handlers.
 * Handlers receive Pub/Sub messages and execute personnal tasks which
 * They define in handleMessage(payload: string)
 */
export interface PubSubTopicHandler {
  readonly topicName: string;

  /**
   * Processes one consumed payload for the handler's topic.
   *
   * @param payload Pub/Sub payload as UTF-8 text.
   */
  handleMessage(payload: string): Promise<void> | void;
}

/**
 * Shared Pub/Sub runtime that owns topic publishing plus one ephemeral pull
 * subscription per registered feature handler.
 */
@Injectable()
export class PubSubRuntimeService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  // One feature-level message handler per logical Pub/Sub topic.
  // Map's keys are topic names
  private readonly handlers = new Map<string, PubSubTopicHandler>();

  // Local subscription lifecycle state per logical Pub/Sub topic.
  // Map's keys are topic names
  private readonly topicSubscriptionStates = new Map<
    string,
    TopicSubscriptionState
  >();

  // Cached Pub/Sub Topic client wrappers per logical Pub/Sub topic.
  // Map's keys are topic names
  private readonly topics = new Map<string, Topic>();

  // Prevents new work from starting while Nest is shutting the runtime down.
  // All of this to avoid shutdown races.
  private isShuttingDown = false;

  /**
   * Receives the shared Pub/Sub client.
   *
   * @param logger Nest-injected Pino logger.
   * @param pubsub Shared Pub/Sub client provider.
   */
  constructor(
    private readonly logger: PinoLogger,
    @Inject(PUBSUB_CLIENT)
    private readonly pubsub: PubSub,
  ) {
    this.logger.setContext(PubSubRuntimeService.name);
  }

  /**
   * Registers one topic handler before runtime startup.
   *
   * @param handler Feature-level topic handler.
   */
  registerHandler(handler: PubSubTopicHandler): void {
    const existingHandler = this.handlers.get(handler.topicName);

    if (existingHandler && existingHandler !== handler) {
      throw new Error(
        `Pub/Sub topic handler already registered for topic "${handler.topicName}".`,
      );
    }

    this.handlers.set(handler.topicName, handler);
  }

  /**
   * Creates one ephemeral pull subscription per registered handler and starts
   * dispatching consumed topic payloads to local feature handlers.
   */
  async onApplicationBootstrap(): Promise<void> {
    for (const handler of this.handlers.values()) {
      await this.ensureHandlerSubscription(handler);
    }
  }

  /**
   * Closes and deletes the ephemeral subscriptions during Nest shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;

    for (const entry of this.topicSubscriptionStates.values()) {
      if (entry.reconnectTimer) {
        clearTimeout(entry.reconnectTimer);
        entry.reconnectTimer = null;
      }

      await this.disposeSubscription(entry, true);
    }

    this.topicSubscriptionStates.clear();
    this.topics.clear();
    await this.pubsub.close();
  }

  /**
   * Sends one serialized message to a Pub/Sub topic through the shared client.
   *
   * @param message Serialized outbound message.
   */
  async send(message: PubSubOutboundMessage): Promise<void> {
    const topic = this.getTopic(message.topic);

    await topic.publishMessage({
      data: Buffer.from(message.value, 'utf8'),
      orderingKey: message.orderingKey,
    });
  }

  /**
   * Ensures this process has an active Pub/Sub subscription for the
   * handler's topic, reusing the existing remote resource when it still exists,
   * recreating it when needed, attaching local listeners, and scheduling a
   * reconnect retry if the open attempt fails.
   *
   * @param handler Feature-level handler.
   */
  private async ensureHandlerSubscription(
    handler: PubSubTopicHandler,
  ): Promise<void> {
    const topicSubscriptionState = this.getOrCreateTopicSubscriptionState(
      handler.topicName,
    );

    if (
      this.isShuttingDown ||
      topicSubscriptionState.opening ||
      topicSubscriptionState.PubSubSubscription !== null
    ) {
      return;
    }

    topicSubscriptionState.opening = true;

    try {
      const topic = this.getTopic(handler.topicName);
      const pubSubSubscription = await this.getOrCreatePubSubSubscription(
        topic,
        topicSubscriptionState,
      );

      if (this.isShuttingDown) {
        topicSubscriptionState.opening = false;
        await this.disposeSubscription(
          topicSubscriptionState,
          false,
          pubSubSubscription,
        );
        return;
      }

      // When Pub/Sub delivers a message event on this subscription, delegate it to the handler.
      pubSubSubscription.on('message', (message) => {
        void this.handleSubscriptionMessage(handler, message);
      });

      pubSubSubscription.on('error', (error) => {
        void this.handleSubscriptionFailure(handler, pubSubSubscription, error);
      });
      pubSubSubscription.on('close', () => {
        void this.handleSubscriptionClose(handler, pubSubSubscription);
      });

      // After a successful subscription open/reopen, associate the Pub Sub Subscription
      // to the topicSubscriptionState
      topicSubscriptionState.PubSubSubscription = pubSubSubscription;

      // After a successful subscription open/reopen, reset the retry delay back to the initial baseline
      topicSubscriptionState.reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS;
    } catch {
      // Opening/reopening the subscription is retried with backoff, so keep
      // this transient failure path silent.
      this.scheduleReconnect(handler, topicSubscriptionState);
    } finally {
      topicSubscriptionState.opening = false;
    }
  }

  /**
   * Decodes one received Pub/Sub message, delegates it to the handler, and
   * acknowledges success or requests redelivery on failure.
   *
   * @param handler Feature-level handler for the topic.
   * @param message Received Pub/Sub message.
   */
  private async handleSubscriptionMessage(
    handler: PubSubTopicHandler,
    message: Message,
  ): Promise<void> {
    try {
      await handler.handleMessage(message.data.toString('utf8'));
      message.ack();
    } catch (error) {
      this.reportBackgroundFailure({
        error,
        message: `Pub/Sub message handling failed for topic ${handler.topicName}: ${this.toErrorMessage(error)}`,
      });
      message.nack();
    }
  }

  /**
   * Reacts to one terminal subscription error by closing the dead stream and
   * scheduling a reconnect attempt with backoff.
   *
   * @param handler Feature-level handler for the topic.
   * @param subscription Subscription that emitted the error.
   * @param error Terminal subscription error.
   */
  private async handleSubscriptionFailure(
    handler: PubSubTopicHandler,
    subscription: Subscription,
    error: unknown,
  ): Promise<void> {
    const topicSubscriptionState = this.topicSubscriptionStates.get(
      handler.topicName,
    );

    if (
      this.isShuttingDown ||
      topicSubscriptionState?.PubSubSubscription !== subscription
    ) {
      return;
    }

    this.reportBackgroundFailure({
      error,
      message: `Pub/Sub subscription failed for ${topicSubscriptionState.name}: ${this.toErrorMessage(error)}`,
    });

    await this.disposeSubscription(topicSubscriptionState, false, subscription);
    this.scheduleReconnect(handler, topicSubscriptionState);
  }

  /**
   * Reacts to one unexpected subscription close by scheduling a reconnect
   * attempt unless the runtime is shutting down.
   *
   * @param handler Feature-level handler for the topic.
   * @param subscription Subscription that closed unexpectedly.
   */
  private async handleSubscriptionClose(
    handler: PubSubTopicHandler,
    subscription: Subscription,
  ): Promise<void> {
    const entry = this.topicSubscriptionStates.get(handler.topicName);

    if (this.isShuttingDown || entry?.PubSubSubscription !== subscription) {
      return;
    }

    await this.disposeSubscription(entry, false, subscription);
    this.scheduleReconnect(handler, entry);
  }

  /**
   * Returns the cached local Pub/Sub Topic client wrapper for the requested name.
   * If not in cache, then creates one, save it in topics and return it.
   *
   * @param topicName Pub/Sub topic name.
   * @returns a Topic
   */
  private getTopic(topicName: string): Topic {
    const existingTopic = this.topics.get(topicName);

    if (existingTopic) {
      return existingTopic;
    }

    const topic = this.pubsub.topic(topicName, {
      messageOrdering: true,
    });

    this.topics.set(topicName, topic);

    return topic;
  }

  /**
   * Returns the cached subscription entry for a topic, creating its stable
   * per-process subscription name the first time it is requested.
   *
   * @param topicName Pub/Sub topic name.
   * @returns Cached subscription lifecycle entry.
   */
  private getOrCreateTopicSubscriptionState(
    topicName: string,
  ): TopicSubscriptionState {
    const existingEntry = this.topicSubscriptionStates.get(topicName);

    if (existingEntry) {
      return existingEntry;
    }

    const entry: TopicSubscriptionState = {
      name: this.createTopicSubscriptionName(topicName),
      PubSubSubscription: null,
      reconnectDelayMs: INITIAL_RECONNECT_DELAY_MS,
      reconnectTimer: null,
      opening: false,
    };

    this.topicSubscriptionStates.set(topicName, entry);

    return entry;
  }

  /**
   * Reuses the stable per-process subscription if it still exists, otherwise
   * recreates it on the topic.
   *
   * @param topic Pub/Sub topic wrapper.
   * @param entry Subscription lifecycle entry.
   * @returns Active subscription wrapper ready for listeners.
   */
  private async getOrCreatePubSubSubscription(
    topic: Topic,
    entry: TopicSubscriptionState,
  ): Promise<Subscription> {
    const pubSubSubscription = topic.subscription(entry.name);
    const [exists] = await pubSubSubscription.exists();

    if (exists) {
      return pubSubSubscription;
    }

    const [createdSubscription] = await topic.createSubscription(entry.name, {
      enableMessageOrdering: true,
      // if this ephemeral subscription is inactive long enough,
      // Pub/Sub can automatically remove it after about one day.
      expirationPolicy: {
        ttl: {
          seconds: 86_400,
        },
      },
    });

    return createdSubscription;
  }

  /**
   * Schedules one reconnect attempt with exponential backoff unless another
   * retry is already pending.
   *
   * @param handler Feature-level handler for the topic.
   * @param topicSubscriptionState Subscription lifecycle entry.
   */
  private scheduleReconnect(
    handler: PubSubTopicHandler,
    topicSubscriptionState: TopicSubscriptionState,
  ): void {
    if (
      this.isShuttingDown ||
      topicSubscriptionState.reconnectTimer !== null ||
      topicSubscriptionState.opening ||
      topicSubscriptionState.PubSubSubscription !== null
    ) {
      return;
    }

    const delayMs = topicSubscriptionState.reconnectDelayMs;

    // Sets a timer which will trigger later a new try of ensureHandlerSubscription(handler)
    topicSubscriptionState.reconnectTimer = setTimeout(() => {
      topicSubscriptionState.reconnectTimer = null;
      void this.ensureHandlerSubscription(handler);
    }, delayMs);
    // tells Node.js that this timer should not keep the process alive by itself.
    // Concretly, in this class case, that means that a scheduled reconnect retry
    // should not prevent the backend process from terminating
    topicSubscriptionState.reconnectTimer.unref?.();

    // Sets the new delay to wait before retrying to connect to Pub Sub
    topicSubscriptionState.reconnectDelayMs = Math.min(
      delayMs * 2,
      MAX_RECONNECT_DELAY_MS,
    );
  }

  /**
   * Detaches listeners, closes the local subscription stream, and optionally
   * deletes the remote subscription resource.
   *
   * @param entry Subscription lifecycle entry.
   * @param deleteRemote Whether to delete the remote subscription resource.
   * @param subscriptionOverride Subscription instance to dispose if the entry
   * currently points at a different object.
   */
  private async disposeSubscription(
    entry: TopicSubscriptionState,
    deleteRemote: boolean,
    subscriptionOverride?: Subscription,
  ): Promise<void> {
    const subscription = subscriptionOverride ?? entry.PubSubSubscription;

    if (subscription === null || subscription === undefined) {
      if (deleteRemote) {
        try {
          await this.pubsub.subscription(entry.name).delete();
        } catch {
          // Best-effort cleanup during shutdown.
        }
      }

      entry.PubSubSubscription = null;
      return;
    }

    subscription.removeAllListeners();

    try {
      await subscription.close();
    } catch {
      // Best-effort cleanup during shutdown or reconnect.
    }

    if (deleteRemote) {
      try {
        await subscription.delete();
      } catch {
        // Best-effort cleanup during shutdown.
      }
    }

    if (entry.PubSubSubscription === subscription) {
      entry.PubSubSubscription = null;
    }
  }

  /**
   * Builds a unique subscription name so each backend instance receives the
   * full realtime stream for its own local subscribers.
   *
   * @param topicName Feature-level topic name.
   * @returns Unique Pub/Sub subscription name.
   */
  private createTopicSubscriptionName(topicName: string): string {
    const normalizedHostname = hostname()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const normalizedTopicName = topicName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${normalizedTopicName}-${normalizedHostname}-${randomUUID()}`;
  }

  /**
   * Converts an unknown error into a stable loggable message.
   *
   * @param error Unknown error value.
   * @returns Human-readable error message.
   */
  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (
      typeof error === 'string' ||
      typeof error === 'number' ||
      typeof error === 'boolean' ||
      typeof error === 'bigint'
    ) {
      return String(error);
    }

    if (error === null || error === undefined) {
      return String(error);
    }

    try {
      return JSON.stringify(error);
    } catch {
      return 'Unserializable error';
    }
  }

  /**
   * Logs one unexpected background runtime failure and forwards it to Sentry.
   *
   * @param params Failure payload.
   * @param params.error Unknown failure value.
   * @param params.message Human-readable failure message.
   */
  private reportBackgroundFailure(params: {
    error: unknown;
    message: string;
  }): void {
    let stackTrace: string | undefined;

    if (params.error instanceof Error) {
      stackTrace = params.error.stack;
    }

    this.logger.error(params.message, stackTrace);

    if (Sentry.isEnabled()) {
      Sentry.captureException(params.error, {
        contexts: {
          backgroundFailure: {
            message: params.message,
            service: PubSubRuntimeService.name,
          },
        },
      });
    }
  }
}
