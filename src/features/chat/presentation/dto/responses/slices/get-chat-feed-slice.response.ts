import { ChatFeedSliceResponse } from '../../../../application/use-cases/get-chat-feed-slice.use-case';
import { GetChatResponse } from '../common/get-chat.response';

/**
 * HTTP response body returned by the cursor-based get-chat-feed-slice
 * endpoint.
 */
export class GetChatFeedSliceResponse {
  /**
   * Chat-feed items in the current slice.
   */
  chats!: GetChatResponse[];

  /**
   * Opaque cursor to request the next slice, when available.
   */
  nextCursor?: string;

  /**
   * Builds the HTTP response DTO from the application-layer slice result.
   *
   * @param slice Cursor-based chat-feed result returned by the use case.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromChatFeedSlice(
    slice: ChatFeedSliceResponse,
  ): GetChatFeedSliceResponse {
    return {
      chats: slice.items.map((item) => GetChatResponse.fromChat(item)),
      ...(slice.nextCursor ? { nextCursor: slice.nextCursor } : {}),
    };
  }
}
