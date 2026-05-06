import { ChatFeedItem } from '../entities/chat-feed-item';

/**
 * Domain event emitted when the public chat feed changes.
 */
export class ChatFeedEvent {
  /**
   * Creates one event indicating that a new chat should appear in the feed.
   *
   * @param item Chat-feed item to surface to subscribers.
   * @returns A chat-feed event.
   */
  static chatAdded(item: ChatFeedItem): ChatFeedEvent {
    return new ChatFeedEvent('feed.chat_added', item);
  }

  /**
   * Creates one event indicating that an existing chat changed in the feed.
   *
   * @param item Chat-feed item to surface to subscribers.
   * @returns A chat-feed event.
   */
  static chatUpdated(item: ChatFeedItem): ChatFeedEvent {
    return new ChatFeedEvent('feed.chat_updated', item);
  }

  /**
   * Stores immutable chat-feed event state.
   *
   * @param type Stable chat-feed event name.
   * @param item Chat-feed item to surface to subscribers.
   */
  private constructor(
    readonly type: ChatFeedEventType,
    readonly item: ChatFeedItem,
  ) {}
}

export type ChatFeedEventType = 'feed.chat_added' | 'feed.chat_updated';
