import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter } from 'rxjs';
import {
  KafkaRuntimeService,
  type KafkaTopicHandler,
} from '../../../../core/kafka/kafka-runtime.service';
import { type ChatListEventBus } from '../../application/ports/chat-list-event-bus.port';
import { ChatListEvent } from '../../domain/events/chat-list.event';
import { decodeChatListEvent } from './kafka-chat-event.codec';
import { CHAT_KAFKA_LIST_TOPIC } from './chat-kafka-topics';

/**
 * Kafka-backed implementation of the chat-list event bus port.
 */
@Injectable()
export class KafkaChatListEventBus
  implements ChatListEventBus, KafkaTopicHandler
{
  readonly topic = CHAT_KAFKA_LIST_TOPIC;

  private readonly subject = new Subject<ChatListEvent>();

  /**
   * Receives the shared Kafka runtime and registers the chat-list topic
   * handler.
   *
   * @param kafkaRuntime Shared Kafka runtime.
   */
  constructor(private readonly kafkaRuntime: KafkaRuntimeService) {
    this.kafkaRuntime.registerHandler(this);
  }

  /**
   * Opens one live chat-list stream filtered to the requested user.
   *
   * @param userId Caller scope used to open the stream.
   * @returns Observable list-event stream.
   */
  subscribe(userId: string): Observable<ChatListEvent> {
    return this.subject
      .asObservable()
      .pipe(
        filter((event) =>
          event.chat.members.some((member) => member.id === userId),
        ),
      );
  }

  /**
   * Decodes one consumed Kafka payload and forwards it to local subscribers.
   *
   * @param payload Kafka payload consumed from the chat-list topic.
   */
  handleMessage(payload: string): void {
    this.subject.next(decodeChatListEvent(payload));
  }
}
