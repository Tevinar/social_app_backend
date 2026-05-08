import { GetChatResponse } from '../common/get-chat.response';
import { ChatWriteResult } from '../../../../application/use-cases/results/chat-write.result';
import { GetChatMessageResponse } from '../common/get-chat-message.response';

/**
 * HTTP response body returned after one successful chat write.
 */
export class ChatWriteResponse {
  /**
   * Updated chat payload.
   */
  chat!: GetChatResponse;

  /**
   * Newly created chat message payload.
   */
  chatMessage!: GetChatMessageResponse;

  /**
   * Builds the response DTO from one chat write result.
   *
   * @param result Chat write result.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromChatWriteResult(result: ChatWriteResult): ChatWriteResponse {
    return {
      chat: GetChatResponse.fromChat(result.chat),
      chatMessage: GetChatMessageResponse.fromChatMessage(result.chatMessage),
    };
  }
}
