import { Chat } from '../../domain/entities/chat';
import { type ChatFeedCursor } from '../pagination/chat-feed.cursor';

export const CHAT_FEED_READER = Symbol('CHAT_FEED_READER');

/**
 * Application port used to read chat-feed items for one caller.
 */
export interface ChatFeedReader {
  /**
   * Reads one recent slice of chats ordered from most recent activity to least
   * recent activity for the caller.
   *
   * @param params Cursor window requested by the caller.
   * @returns Current slice of chat-feed items.
   */
  findRecentSlice(
    params: FindRecentChatFeedSliceParams,
  ): Promise<RecentChatFeedSlice>;
}

export type FindRecentChatFeedSliceParams = {
  userId: string;
  limit: number;
  cursor?: ChatFeedCursor;
};

export type RecentChatFeedSlice = {
  items: Chat[];
};
