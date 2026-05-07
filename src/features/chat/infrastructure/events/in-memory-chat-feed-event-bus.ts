import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter } from 'rxjs';
import { type ChatFeedEventBus } from '../../application/ports/chat-feed-event-bus.port';
import { ChatFeedEvent } from '../../domain/events/chat-feed.event';

/**
 * In-memory RxJS-backed implementation of the chat-feed event bus.
 */
@Injectable()
export class InMemoryChatFeedEventBus implements ChatFeedEventBus {
  private readonly subject = new Subject<ChatFeedEvent>();

  /**
   * Publishes one chat-feed event to all current subscribers.
   *
   * @param event Feed event to broadcast.
   */
  publish(event: ChatFeedEvent): void {
    this.subject.next(event);
  }

  /**
   * Opens one in-memory chat-feed event stream filtered to the requested user.
   *
   * @param userId Caller scope used to open the stream.
   * @returns Observable feed-event stream.
   */
  subscribe(userId: string): Observable<ChatFeedEvent> {
    return this.subject
      .asObservable()
      .pipe(
        filter((event) =>
          event.item.members.some((member) => member.id === userId),
        ),
      );
  }
}
