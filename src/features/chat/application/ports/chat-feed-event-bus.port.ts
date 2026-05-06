import { Observable } from 'rxjs';
import { ChatFeedEvent } from '../../domain/events/chat-feed.event';

export const CHAT_FEED_EVENT_BUS = Symbol('CHAT_FEED_EVENT_BUS');

/**
 * Application port used to publish and consume chat feed events.
 */
export interface ChatFeedEventBus {
  /**
   * Publishes one chat feed event to current subscribers.
   *
   * @param event Feed event to broadcast.
   */
  publish(event: ChatFeedEvent): void;

  /**
   * Opens a live stream of chat feed events.
   *
   * @returns Observable feed-event stream.
   */
  subscribe(): Observable<ChatFeedEvent>;
}
