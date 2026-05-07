import { Chat } from '../entities/chat';

/**
 * Domain event emitted when the public chat feed changes.
 */
export class ChatFeedEvent {
  /**
   * Creates one event indicating that a new chat should appear in the feed.
   *
   * @param item Chat to surface to subscribers.
   * @returns A chat-feed event.
   */
  static chatAdded(item: Chat): ChatFeedEvent {
    return new ChatFeedEvent('feed.chat_added', item);
  }

  /**
   * Creates one event indicating that an existing chat changed in the feed.
   *
   * @param item Chat to surface to subscribers.
   * @returns A chat-feed event.
   */
  static chatUpdated(item: Chat): ChatFeedEvent {
    return new ChatFeedEvent('feed.chat_updated', item);
  }

  /**
   * Stores immutable chat-feed event state.
   *
   * @param type Stable chat-feed event name.
   * @param item Chat to surface to subscribers.
   */
  private constructor(
    readonly type: ChatFeedEventType,
    readonly item: Chat,
  ) {}
}

export type ChatFeedEventType = 'feed.chat_added' | 'feed.chat_updated';
