import { CreateChatMessageResult } from '../../../application/use-cases/create-chat-message.use-case';
import { GetChatFeedItemResponse } from './get-chat-feed-item.response';
import { GetChatMessageResponse } from './get-chat-message.response';

/**
 * HTTP response body returned by the create-chat-message endpoint.
 */
export class CreateChatMessageResponse {
  /**
   * Updated chat-feed item after the new message.
   */
  chatFeedItem!: GetChatFeedItemResponse;

  /**
   * Newly created chat message.
   */
  chatMessage!: GetChatMessageResponse;

  /**
   * Builds the HTTP response DTO from the application-layer creation result.
   *
   * @param result Chat-message creation result returned by the use case.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromCreateChatMessageResult(
    result: CreateChatMessageResult,
  ): CreateChatMessageResponse {
    return {
      chatFeedItem: GetChatFeedItemResponse.fromChatFeedItem(
        result.chatFeedItem,
      ),
      chatMessage: GetChatMessageResponse.fromChatMessage(result.chatMessage),
    };
  }
}
