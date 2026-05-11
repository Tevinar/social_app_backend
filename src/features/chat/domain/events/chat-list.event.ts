import { Chat } from '../entities/chat';

/**
 * Domain event emitted when the public chat list changes.
 */
export class ChatListEvent {
  /**
   * Creates one event indicating that a new chat should appear in the list.
   *
   * @param chat Chat to surface to subscribers.
   * @returns A chat-list event.
   */
  static chatAdded(chat: Chat): ChatListEvent {
    return new ChatListEvent('chat.added', chat);
  }

  /**
   * Creates one event indicating that an existing chat changed in the list.
   *
   * @param chat Chat to surface to subscribers.
   * @returns A chat-list event.
   */
  static chatUpdated(chat: Chat): ChatListEvent {
    return new ChatListEvent('chat.updated', chat);
  }

  /**
   * Stores immutable chat-list event state.
   *
   * @param type Stable chat-list event name.
   * @param chat Chat to surface to subscribers.
   */
  private constructor(
    readonly type: ChatListEventType,
    readonly chat: Chat,
  ) {}
}

export type ChatListEventType = 'chat.added' | 'chat.updated';
