import { CreateChatResult } from '../../../application/use-cases/create-chat.use-case';
import { GetChatResponse } from './get-chat.response';
import { GetChatMessageResponse } from './get-chat-message.response';

/**
 * HTTP response body returned by the create-chat endpoint.
 */
export class CreateChatResponse {
  /**
   * Newly created chat.
   */
  chat!: GetChatResponse;

  /**
   * First message created with the chat.
   */
  firstMessage!: GetChatMessageResponse;

  /**
   * Builds the HTTP response DTO from the application-layer creation result.
   *
   * @param result Chat creation result returned by the use case.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromCreateChatResult(result: CreateChatResult): CreateChatResponse {
    return {
      chat: GetChatResponse.fromChat(result.chat),
      firstMessage: GetChatMessageResponse.fromChatMessage(result.firstMessage),
    };
  }
}
