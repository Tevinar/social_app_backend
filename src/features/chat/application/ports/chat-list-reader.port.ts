import { Chat } from '../../domain/entities/chat';
import { type ChatListCursor as ChatListCursor } from '../pagination/chat-list.cursor';

export const CHAT_LIST_READER = Symbol('CHAT_LIST_READER');

/**
 * Application port used to read chat-list items for one caller.
 */
export interface ChatListReader {
  /**
   * Reads one recent slice of chats ordered from most recent activity to least
   * recent activity for the caller.
   *
   * @param params Cursor window requested by the caller.
   * @returns Current slice of chat-list items.
   */
  findRecentSlice(
    params: FindRecentChatListSliceParams,
  ): Promise<RecentChatListSlice>;
}

export type FindRecentChatListSliceParams = {
  userId: string;
  limit: number;
  cursor?: ChatListCursor;
};

export type RecentChatListSlice = {
  items: Chat[];
};
