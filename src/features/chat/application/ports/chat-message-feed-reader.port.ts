import { ChatMessage } from '../../domain/entities/chat-message';
import { type ChatMessageCursor } from '../pagination/chat-message.cursor';

export const CHAT_MESSAGE_FEED_READER = Symbol('CHAT_MESSAGE_FEED_READER');

/**
 * Application port used to read chat-message feed items for one caller inside
 * one chat.
 */
export interface ChatMessageFeedReader {
  /**
   * Reads one recent slice of messages ordered from most recent to least recent
   * inside one chat visible to the caller.
   *
   * @param params Cursor window requested by the caller.
   * @returns Current slice of chat messages.
   */
  findRecentSlice(
    params: FindRecentChatMessageFeedSliceParams,
  ): Promise<ChatMessage[]>;
}

export type FindRecentChatMessageFeedSliceParams = {
  userId: string;
  chatId: string;
  limit: number;
  cursor?: ChatMessageCursor;
};
