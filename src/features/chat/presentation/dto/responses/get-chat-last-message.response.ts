import { ChatLastMessage } from '../../../domain/entities/chat-last-message';
import { GetUserSummaryResponse } from './get-user-summary.response';

/**
 * HTTP response body representing the latest message preview shown for one
 * chat.
 */
export class GetChatLastMessageResponse {
  /**
   * Stable message identifier.
   */
  id!: string;

  /**
   * Public author summary when still available.
   */
  author!: GetUserSummaryResponse | null;

  /**
   * Public preview content.
   */
  content!: string;

  /**
   * Message creation timestamp serialized as an ISO string.
   */
  createdAt!: string;

  /**
   * Builds the response DTO from one chat last-message entity.
   *
   * @param lastMessage Chat last-message entity.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromChatLastMessage(
    lastMessage: ChatLastMessage,
  ): GetChatLastMessageResponse {
    return {
      id: lastMessage.id,
      author: lastMessage.author
        ? GetUserSummaryResponse.fromUserSummary(lastMessage.author)
        : null,
      content: lastMessage.content,
      createdAt: lastMessage.createdAt.toISOString(),
    };
  }
}
