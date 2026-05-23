import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter } from 'rxjs';
import {
  PubSubRuntimeService,
  type PubSubTopicHandler,
} from '../../../../core/pubsub/pubsub-runtime.service';
import {
  type ChatMessageListEventBus,
  type SubscribeToChatMessageListParams,
} from '../../application/ports/chat-message-list-event-bus.port';
import { ChatMessageListEvent } from '../../domain/events/chat-message-list.event';
import { decodeChatMessageListEvent } from './chat-realtime-event.codec';
import { CHAT_MESSAGE_LIST_REALTIME_TOPIC } from './chat-realtime-topics';

/**
 * Pub/Sub-backed implementation of the chat-message event bus port.
 */
@Injectable()
export class PubSubChatMessageListEventBus
  implements ChatMessageListEventBus, PubSubTopicHandler
{
  readonly topicName = CHAT_MESSAGE_LIST_REALTIME_TOPIC;

  private readonly subject = new Subject<ChatMessageListEvent>();

  /**
   * Receives the shared Pub/Sub runtime and registers the chat-message topic
   * handler.
   *
   * @param pubsubRuntime Shared Pub/Sub runtime.
   */
  constructor(private readonly pubsubRuntime: PubSubRuntimeService) {
    this.pubsubRuntime.registerHandler(this);
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
   * Decodes one consumed Pub/Sub payload and forwards it to local subscribers.
   *
   * @param payload Pub/Sub payload consumed from the chat-message topic.
   */
  handleMessage(payload: string): void {
    this.subject.next(decodeChatMessageListEvent(payload));
  }
}
