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
import { decodeChatMessageListEvent } from './kafka-chat-event.codec';
import { CHAT_KAFKA_MESSAGE_LIST_TOPIC } from './chat-kafka-topics';

/**
 * Kafka-backed implementation of the chat-message event bus port.
 */
@Injectable()
export class KafkaChatMessageListEventBus
  implements ChatMessageListEventBus, KafkaTopicHandler
{
  readonly topic = CHAT_KAFKA_MESSAGE_LIST_TOPIC;

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
