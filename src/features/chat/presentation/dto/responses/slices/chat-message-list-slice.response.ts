import { type ChatMessageListSliceResult } from '../../../../application/use-cases/get-chat-message-list-slice.use-case';
import { GetChatMessageResponse } from '../common/get-chat-message.response';

/**
 * HTTP response body returned by the cursor-based get-chat-message-list-slice
 * endpoint.
 */
export class ChatMessageListSliceResponse {
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
  static fromSlice(
    slice: ChatMessageListSliceResult,
  ): ChatMessageListSliceResponse {
    return {
      chatMessages: slice.chatMessages.map((chatMessage) =>
        GetChatMessageResponse.fromChatMessage(chatMessage),
      ),
      ...(slice.nextCursor ? { nextCursor: slice.nextCursor } : {}),
    };
  }
}
