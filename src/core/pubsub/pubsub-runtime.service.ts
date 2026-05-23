import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Message, PubSub, Subscription, Topic } from '@google-cloud/pubsub';
import { PUBSUB_CLIENT } from './pubsub.provider';

type PubSubOutboundMessage = {
  topic: string;
  key?: string;
  value: string;
};

type SubscriptionEntry = {
  name: string;
  subscription: Subscription;
};

/**
 * Contract implemented by feature-level Pub/Sub topic handlers.
 */
export interface PubSubTopicHandler {
  readonly topic: string;

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
  private readonly logger = new Logger(PubSubRuntimeService.name);

  private readonly handlers = new Map<string, PubSubTopicHandler>();
  private readonly subscriptions = new Map<string, SubscriptionEntry>();
  private readonly topics = new Map<string, Topic>();

  /**
   * Receives the shared Pub/Sub client.
   *
   * @param pubsub Shared Pub/Sub client provider.
   */
  constructor(
    @Inject(PUBSUB_CLIENT)
    private readonly pubsub: PubSub,
  ) {}

  /**
   * Registers one topic handler before runtime startup.
   *
   * @param handler Feature-level topic handler.
   */
  registerHandler(handler: PubSubTopicHandler): void {
    const existingHandler = this.handlers.get(handler.topic);

    if (existingHandler && existingHandler !== handler) {
      throw new Error(
        `Pub/Sub topic handler already registered for topic "${handler.topic}".`,
      );
    }

    this.handlers.set(handler.topic, handler);
  }

  /**
   * Creates one ephemeral pull subscription per registered handler and starts
   * dispatching consumed topic payloads to local feature handlers.
   */
  async onApplicationBootstrap(): Promise<void> {
    for (const handler of this.handlers.values()) {
      await this.openHandlerSubscription(handler);
    }
  }

  /**
   * Closes and deletes the ephemeral subscriptions during Nest shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    for (const entry of this.subscriptions.values()) {
      entry.subscription.removeAllListeners();

      try {
        await entry.subscription.close();
      } catch (error) {
        this.logger.warn(
          `Pub/Sub subscription close failed for ${entry.name}: ${this.toErrorMessage(error)}`,
        );
      }

      try {
        await entry.subscription.delete();
      } catch (error) {
        this.logger.warn(
          `Pub/Sub subscription delete failed for ${entry.name}: ${this.toErrorMessage(error)}`,
        );
      }
    }

    this.subscriptions.clear();
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
      ...(message.key === undefined
        ? {}
        : {
            attributes: {
              messageKey: message.key,
            },
          }),
    });
  }

  /**
   * Creates one unique per-instance subscription for the handler's topic and
   * starts consuming messages from it.
   *
   * @param handler Feature-level handler.
   */
  private async openHandlerSubscription(
    handler: PubSubTopicHandler,
  ): Promise<void> {
    const topic = this.getTopic(handler.topic);
    const subscriptionName = this.getSubscriptionName(handler.topic);
    const [subscription] = await topic.createSubscription(subscriptionName, {
      // if this ephemeral subscription is inactive long enough,
      // Pub/Sub can automatically remove it after about one day.
      expirationPolicy: {
        ttl: {
          seconds: 86_400,
        },
      },
    });

    subscription.on('message', (message) => {
      void this.handleSubscriptionMessage(handler, message);
    });
    subscription.on('error', (error) => {
      this.logger.error(
        `Pub/Sub subscription failed for ${subscriptionName}: ${this.toErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    });

    this.subscriptions.set(handler.topic, {
      name: subscriptionName,
      subscription,
    });
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
      this.logger.warn(
        `Pub/Sub message handling failed for topic ${handler.topic}: ${this.toErrorMessage(error)}`,
      );
      message.nack();
    }
  }

  /**
   * Returns the cached topic object for the requested topic name.
   *
   * @param topicName Pub/Sub topic name.
   * @returns Cached topic client wrapper.
   */
  private getTopic(topicName: string): Topic {
    const existingTopic = this.topics.get(topicName);

    if (existingTopic) {
      return existingTopic;
    }

    const topic = this.pubsub.topic(topicName);

    this.topics.set(topicName, topic);

    return topic;
  }

  /**
   * Builds a unique subscription name so each backend instance receives the
   * full realtime stream for its own local subscribers.
   *
   * @param topicName Feature-level topic name.
   * @returns Unique Pub/Sub subscription name.
   */
  private getSubscriptionName(topicName: string): string {
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
}
