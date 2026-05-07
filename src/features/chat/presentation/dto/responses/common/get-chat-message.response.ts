import { ChatMessage } from '../../../../domain/entities/chat-message';
import { GetUserSummaryResponse } from './get-user-summary.response';

/**
 * HTTP response body representing one public chat message.
 */
export class GetChatMessageResponse {
  /**
   * Stable message identifier.
   */
  id!: string;

  /**
   * Stable parent chat identifier.
   */
  chatId!: string;

  /**
   * Public author summary when still available.
   */
  author!: GetUserSummaryResponse | null;

  /**
   * Public message content.
   */
  content!: string;

  /**
   * Message creation timestamp serialized as an ISO string.
   */
  createdAt!: string;

  /**
   * Message last-updated timestamp serialized as an ISO string.
   */
  updatedAt!: string;

  /**
   * Builds the response DTO from one chat-message entity.
   *
   * @param chatMessage Chat-message entity.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromChatMessage(chatMessage: ChatMessage): GetChatMessageResponse {
    return {
      id: chatMessage.id,
      chatId: chatMessage.chatId,
      author: chatMessage.author
        ? GetUserSummaryResponse.fromUserSummary(chatMessage.author)
        : null,
      content: chatMessage.content,
      createdAt: chatMessage.createdAt.toISOString(),
      updatedAt: chatMessage.updatedAt.toISOString(),
    };
  }
}
