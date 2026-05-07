import { type ChatMessageFeedSliceResponse } from '../../../application/use-cases/get-chat-message-feed-slice.use-case';
import { GetChatMessageResponse } from './get-chat-message.response';

/**
 * HTTP response body returned by the cursor-based get-chat-message-feed-slice
 * endpoint.
 */
export class GetChatMessageFeedSliceResponse {
  /**
   * Chat messages in the current slice.
   */
  chatMessages!: GetChatMessageResponse[];

  /**
   * Opaque cursor to request the next slice, when available.
   */
  nextCursor?: string;

  /**
   * Builds the HTTP response DTO from the application-layer slice result.
   *
   * @param slice Cursor-based chat-message result returned by the use case.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromChatMessageFeedSlice(
    slice: ChatMessageFeedSliceResponse,
  ): GetChatMessageFeedSliceResponse {
    return {
      chatMessages: slice.chatMessages.map((chatMessage) =>
        GetChatMessageResponse.fromChatMessage(chatMessage),
      ),
      ...(slice.nextCursor ? { nextCursor: slice.nextCursor } : {}),
    };
  }
}
