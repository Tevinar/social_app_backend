import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Consumer, Kafka, Producer } from 'kafkajs';
import { KAFKA_CLIENT } from './kafka.provider';

const KAFKA_RUNTIME_CONSUMER_GROUP_PREFIX = 'social-app-backend-realtime';

type KafkaOutboundMessage = {
  topic: string;
  key?: string;
  value: string;
};

/**
 * Contract implemented by feature-level Kafka topic handlers.
 */
export interface KafkaTopicHandler {
  readonly topic: string;

  /**
   * Processes one consumed payload for the handler's topic.
   *
   * @param payload Kafka payload as UTF-8 text.
   */
  handleMessage(payload: string): Promise<void> | void;
}

/**
 * Shared Kafka runtime that owns one producer, one consumer, and topic
 * dispatch for the whole Nest application instance.
 */
@Injectable()
export class KafkaRuntimeService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly handlers = new Map<string, KafkaTopicHandler>();

  private producer: Producer | null = null;
  private consumer: Consumer | null = null;

  /**
   * Receives the shared KafkaJS client.
   *
   * @param kafka Shared Kafka client provider.
   */
  constructor(
    @Inject(KAFKA_CLIENT)
    private readonly kafka: Kafka,
  ) {}

  /**
   * Registers one topic handler before runtime startup.
   *
   * @param handler Feature-level topic handler.
   */
  registerHandler(handler: KafkaTopicHandler): void {
    const existingHandler = this.handlers.get(handler.topic);

    if (existingHandler && existingHandler !== handler) {
      throw new Error(
        `Kafka topic handler already registered for topic "${handler.topic}".`,
      );
    }

    this.handlers.set(handler.topic, handler);
  }

  /**
   * Connects the shared Kafka producer and consumer, then starts dispatching
   * consumed topic payloads to registered feature handlers.
   */
  async onApplicationBootstrap(): Promise<void> {
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({
      groupId: this.getConsumerGroupId(),
    });

    // Open the shared network connections before any publish/consume work starts.
    await this.producer.connect();
    await this.consumer.connect();

    // Subscribe the shared consumer to every topic registered by feature handlers.
    for (const topic of this.handlers.keys()) {
      await this.consumer.subscribe({
        topic,
        fromBeginning: false,
      });
    }

    await this.consumer.run({
      eachMessage: async ({ topic, message }): Promise<void> => {
        const payload = message.value?.toString();

        if (!payload) {
          return;
        }

        const handler = this.handlers.get(topic);

        if (!handler) {
          return;
        }

        await handler.handleMessage(payload);
      },
    });
  }

  /**
   * Stops the consumer loop and disconnects shared Kafka clients.
   */
  async onModuleDestroy(): Promise<void> {
    await this.consumer?.stop();
    await this.consumer?.disconnect();
    await this.producer?.disconnect();
  }

  /**
   * Sends one serialized message to Kafka through the shared producer.
   *
   * @param message Serialized outbound message.
   */
  async send(message: KafkaOutboundMessage): Promise<void> {
    const producer = this.getProducerOrThrow();
    const kafkaMessage =
      message.key === undefined
        ? {
            value: message.value,
          }
        : {
            key: message.key,
            value: message.value,
          };

    await producer.send({
      topic: message.topic,
      messages: [kafkaMessage],
    });
  }

  /**
   * Builds a unique consumer-group id so each backend instance receives the
   * full realtime stream for its own local subscribers.
   *
   * @returns Unique Kafka consumer-group identifier.
   */
  private getConsumerGroupId(): string {
    return `${KAFKA_RUNTIME_CONSUMER_GROUP_PREFIX}-${hostname()}-${randomUUID()}`;
  }

  /**
   * Returns the connected shared Kafka producer.
   *
   * @returns Connected Kafka producer.
   */
  private getProducerOrThrow(): Producer {
    if (!this.producer) {
      throw new Error('Kafka producer is not connected.');
    }

    return this.producer;
  }
}
