import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter } from 'rxjs';
import {
  type ChatMessageListEventBus,
  type SubscribeToChatMessageListParams,
} from '../../application/ports/chat-message-list-event-bus.port';
import { ChatMessageListEvent } from '../../domain/events/chat-message-list.event';

/**
 * In-memory RxJS-backed implementation of the user-and-chat scoped
 * chat-message event bus.
 */
@Injectable()
export class InMemoryChatMessageEventBus implements ChatMessageListEventBus {
  private readonly subject = new Subject<ChatMessageListEvent>();

  /**
   * Publishes one chat-message event to all current subscribers.
   *
   * @param event Message event to broadcast.
   */
  publish(event: ChatMessageListEvent): void {
    this.subject.next(event);
  }

  /**
   * Opens one in-memory message stream filtered to the requested user and
   * chat.
   *
   * The event itself carries the user ids allowed to receive it, so the
   * in-memory implementation can filter without querying persistence for
   * membership.
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
}
