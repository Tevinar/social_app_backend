import { ChatFeedItem } from '../../../domain/entities/chat-feed-item';
import { GetChatFeedLastMessageResponse } from './get-chat-feed-last-message.response';
import { GetUserSummaryResponse } from './get-user-summary.response';

/**
 * HTTP response body representing one chat item inside the chat feed.
 */
export class GetChatFeedItemResponse {
  /**
   * Stable chat identifier.
   */
  id!: string;

  /**
   * Public chat members.
   */
  members!: GetUserSummaryResponse[];

  /**
   * Latest message preview shown in the feed.
   */
  lastMessage!: GetChatFeedLastMessageResponse | null;

  /**
   * Builds the response DTO from one chat-feed item entity.
   *
   * @param chatFeedItem Chat-feed item entity.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromChatFeedItem(chatFeedItem: ChatFeedItem): GetChatFeedItemResponse {
    return {
      id: chatFeedItem.id,
      members: chatFeedItem.members.map((member) =>
        GetUserSummaryResponse.fromUserSummary(member),
      ),
      lastMessage: chatFeedItem.lastMessage
        ? GetChatFeedLastMessageResponse.fromChatFeedLastMessage(
            chatFeedItem.lastMessage,
          )
        : null,
    };
  }
}
