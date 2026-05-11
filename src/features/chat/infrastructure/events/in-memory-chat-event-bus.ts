import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter } from 'rxjs';
import { type ChatListEventBus } from '../../application/ports/chat-list-event-bus.port';
import { ChatListEvent } from '../../domain/events/chat-list.event';

/**
 * In-memory RxJS-backed implementation of the chat-list event bus.
 */
@Injectable()
export class InMemoryChatListEventBus implements ChatListEventBus {
  private readonly subject = new Subject<ChatListEvent>();

  /**
   * Publishes one chat-list event to all current subscribers.
   *
   * @param event List event to broadcast.
   */
  publish(event: ChatListEvent): void {
    this.subject.next(event);
  }

  /**
   * Opens one in-memory chat-list event stream filtered to the requested user.
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
}
