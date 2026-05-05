import { Observable } from 'rxjs';

export const BLOG_FEED_EVENT_BUS = Symbol('BLOG_FEED_EVENT_BUS');

/**
 * Application port used to publish and consume blog feed events.
 */
export interface BlogFeedEventBus {
  /**
   * Publishes one blog feed event to current subscribers.
   *
   * @param event Feed event to broadcast.
   */
  publish(event: BlogFeedEvent): void;

  /**
   * Opens a live stream of blog feed events.
   *
   * @returns Observable feed-event stream.
   */
  subscribe(): Observable<BlogFeedEvent>;
}

/**
 * One application-level event emitted for the blog feed.
 */
export type BlogFeedEvent = {
  type: 'feed.new_blog_available';
  blogId: string;
};
