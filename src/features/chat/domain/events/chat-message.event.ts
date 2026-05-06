import { ChatMessage } from '../entities/chat-message';

/**
 * Domain event emitted when one visible chat message changes inside a chat
 * conversation.
 */
export class ChatMessageEvent {
  /**
   * Creates one event indicating that a new message should appear in the
   * conversation stream.
   *
   * @param item Chat message to surface to subscribers.
   * @returns A chat-message event.
   */
  static messageAdded(item: ChatMessage): ChatMessageEvent {
    return new ChatMessageEvent('message.added', item);
  }

  /**
   * Stores immutable chat-message event state.
   *
   * @param type Stable chat-message event name.
   * @param item Chat message to surface to subscribers.
   */
  private constructor(
    readonly type: ChatMessageEventType,
    readonly item: ChatMessage,
  ) {}
}

export type ChatMessageEventType = 'message.added';
