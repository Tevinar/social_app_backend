import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter } from 'rxjs';
import { type ChatMessageEventBus } from '../../application/ports/chat-message-event-bus.port';
import { ChatMessageEvent } from '../../domain/events/chat-message.event';

/**
 * In-memory RxJS-backed implementation of the user-scoped chat-message event
 * bus.
 */
@Injectable()
export class InMemoryChatMessageEventBus implements ChatMessageEventBus {
  private readonly subject = new Subject<ChatMessageEvent>();

  /**
   * Publishes one chat-message event to all current subscribers.
   *
   * @param event Message event to broadcast.
   */
  publish(event: ChatMessageEvent): void {
    this.subject.next(event);
  }

  /**
   * Opens one in-memory message stream filtered to the requested user.
   *
   * The event itself carries the user ids allowed to receive it, so the
   * in-memory implementation can filter without querying persistence.
   *
   * @param userId Caller scope used to open the stream.
   * @returns Observable message-event stream.
   */
  subscribe(userId: string): Observable<ChatMessageEvent> {
    return this.subject
      .asObservable()
      .pipe(filter((event) => event.visibleToUserIds.includes(userId)));
  }
}
