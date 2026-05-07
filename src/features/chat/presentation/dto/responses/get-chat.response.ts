import { Chat } from '../../../domain/entities/chat';
import { GetUserSummaryResponse } from './get-user-summary.response';

/**
 * HTTP response body representing one chat.
 */
export class GetChatResponse {
  /**
   * Stable chat identifier.
   */
  id!: string;

  /**
   * Public chat members.
   */
  members!: GetUserSummaryResponse[];

  /**
   * Builds the response DTO from one chat entity.
   *
   * @param chat Chat entity.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromChat(chat: Chat): GetChatResponse {
    return {
      id: chat.id,
      members: chat.members.map((member) =>
        GetUserSummaryResponse.fromUserSummary(member),
      ),
    };
  }
}
