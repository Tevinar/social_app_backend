import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import {
  type BlogFeedEvent,
  type BlogFeedEventBus,
} from '../../application/ports/blog-feed-event-bus.port';

/**
 * In-memory RxJS-backed implementation of the blog feed event bus.
 */
@Injectable()
export class InMemoryBlogFeedEventBus implements BlogFeedEventBus {
  private readonly subject = new Subject<BlogFeedEvent>();

  /**
   * Emits one event to all currently connected subscribers.
   *
   * @param event Feed event to publish.
   */
  publish(event: BlogFeedEvent): void {
    this.subject.next(event);
  }

  /**
   * Exposes the live event stream to application consumers.
   *
   * @returns Observable stream of published feed events.
   */
  subscribe(): Observable<BlogFeedEvent> {
    return this.subject.asObservable();
  }
}
