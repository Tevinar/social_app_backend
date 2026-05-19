import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter } from 'rxjs';
import {
  KafkaRuntimeService,
  type KafkaTopicHandler,
} from '../../../../core/kafka/kafka-runtime.service';
import {
  type ChatMessageListEventBus,
  type SubscribeToChatMessageListParams,
} from '../../application/ports/chat-message-list-event-bus.port';
import { ChatMessageListEvent } from '../../domain/events/chat-message-list.event';
import {
  decodeChatMessageListEvent,
  encodeChatMessageListEvent,
} from './kafka-chat-event.codec';

/**
 * Kafka-backed implementation of the chat-message event bus port.
 */
@Injectable()
export class KafkaChatMessageListEventBus
  implements ChatMessageListEventBus, KafkaTopicHandler
{
  readonly topic = 'chat-message-list-events';

  private readonly subject = new Subject<ChatMessageListEvent>();

  /**
   * Receives the shared Kafka runtime and registers the chat-message topic
   * handler.
   *
   * @param kafkaRuntime Shared Kafka runtime.
   */
  constructor(private readonly kafkaRuntime: KafkaRuntimeService) {
    this.kafkaRuntime.registerHandler(this);
  }

  /**
   * Publishes one chat-message event to the shared Kafka topic.
   *
   * @param event Message event to broadcast.
   * @returns Promise that resolves once Kafka accepts the event.
   */
  publish(event: ChatMessageListEvent): Promise<void> {
    return this.kafkaRuntime.send({
      topic: this.topic,
      key: event.chatMessage.chatId,
      value: encodeChatMessageListEvent(event),
    });
  }

  /**
   * Opens one live message stream filtered to the requested user and chat.
   *
   * @param params Caller and chat scope used to open the stream.
   * @returns Observable message-event stream.
   */
  subscribe(
    params: SubscribeToChatMessageListParams,
  ): Observable<ChatMessageListEvent> {
    return this.subject
      .asObservable()
      .pipe(
        filter(
          (event) =>
            event.visibleToUserIds.includes(params.userId) &&
            event.chatMessage.chatId === params.chatId,
        ),
      );
  }

  /**
   * Decodes one consumed Kafka payload and forwards it to local subscribers.
   *
   * @param payload Kafka payload consumed from the chat-message topic.
   */
  handleMessage(payload: string): void {
    this.subject.next(decodeChatMessageListEvent(payload));
  }
}
