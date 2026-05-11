import { ChatListSliceResult } from '../../../../application/use-cases/get-chat-list-slice.use-case';
import { GetChatResponse } from '../common/get-chat.response';

/**
 * HTTP response body returned by the cursor-based get-chat-list-slice
 * endpoint.
 */
export class ChatListSliceResponse {
  /**
   * Chat-list items in the current slice.
   */
  chats!: GetChatResponse[];

  /**
   * Opaque cursor to request the next slice, when available.
   */
  nextCursor?: string;

  /**
   * Builds the HTTP response DTO from the application-layer slice result.
   *
   * @param slice Cursor-based chat-list result returned by the use case.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromSlice(slice: ChatListSliceResult): ChatListSliceResponse {
    return {
      chats: slice.items.map((item) => GetChatResponse.fromChat(item)),
      ...(slice.nextCursor ? { nextCursor: slice.nextCursor } : {}),
    };
  }
}
