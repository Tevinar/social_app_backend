import { Injectable, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  BlogFeedEvent,
  BLOG_FEED_EVENT_BUS,
  type BlogFeedEventBus,
} from '../ports/blog-feed-event-bus';
import { StreamUseCase } from '../../../../core/contracts/stream-use-case';

/**
 * Application use case that opens the live blog-feed event stream.
 */
@Injectable()
export class SubscribeToBlogFeedUseCase implements StreamUseCase<
  void,
  BlogFeedEvent
> {
  /**
   * Receives the event bus that emits blog feed events.
   *
   * @param blogFeedEventBus Event stream used by blog feed subscribers.
   */
  constructor(
    @Inject(BLOG_FEED_EVENT_BUS)
    private readonly blogFeedEventBus: BlogFeedEventBus,
  ) {}

  /**
   * Opens the blog feed event stream.
   *
   * @returns Observable stream of blog feed events.
   */
  execute(): Observable<BlogFeedEvent> {
    return this.blogFeedEventBus.subscribe();
  }
}
