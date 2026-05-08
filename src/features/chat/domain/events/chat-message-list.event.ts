import { ChatMessage } from '../entities/chat-message';

/**
 * Domain event emitted when one visible chat message changes inside a chat
 * conversation.
 */
export class ChatMessageListEvent {
  /**
   * Creates one event indicating that a new message should appear in the
   * caller's visible message stream.
   *
   * @param item Chat message to surface to subscribers.
   * @param visibleToUserIds Stable identifiers of users allowed to receive the
   * event.
   * @returns A chat-message event.
   */
  static messageAdded(
    item: ChatMessage,
    visibleToUserIds: string[],
  ): ChatMessageListEvent {
    return new ChatMessageListEvent(
      'chat_message.added',
      item,
      visibleToUserIds,
    );
  }

  /**
   * Stores immutable chat-message event state.
   *
   * @param type Stable chat-message event name.
   * @param item Chat message to surface to subscribers.
   * @param visibleToUserIds Stable identifiers of users allowed to receive the
   * event.
   */
  private constructor(
    readonly type: ChatMessageListEventType,
    readonly item: ChatMessage,
    readonly visibleToUserIds: string[],
  ) {}
}

export type ChatMessageListEventType = 'chat_message.added';
