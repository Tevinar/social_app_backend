import { ChatMessage } from '../../domain/entities/chat-message';
import { type ChatMessageCursor } from '../pagination/chat-message-list.cursor';

export const CHAT_MESSAGE_LIST_READER = Symbol('CHAT_MESSAGE_LIST_READER');

/**
 * Application port used to read chat-message list items for one caller inside
 * one chat.
 */
export interface ChatMessageListReader {
  /**
   * Reads one recent slice of messages ordered from most recent to least recent
   * inside one chat visible to the caller.
   *
   * @param params Cursor window requested by the caller.
   * @returns Current slice of chat messages.
   */
  findRecentSlice(
    params: FindRecentChatMessageListSliceParams,
  ): Promise<ChatMessage[]>;
}

export type FindRecentChatMessageListSliceParams = {
  userId: string;
  chatId: string;
  limit: number;
  cursor?: ChatMessageCursor;
};
