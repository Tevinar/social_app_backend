import { ChatFeedEvent } from '../../../../domain/events/chat-feed.event';
import { GetChatResponse } from '../common/get-chat.response';

/**
 * SSE payload returned when one chat-feed event is emitted.
 */
export class GetChatFeedEventResponse {
  /**
   * Stable chat-feed event name.
   */
  type!: string;

  /**
   * Chat-feed item carried by the event.
   */
  item!: GetChatResponse;

  /**
   * Builds the event payload from one chat-feed event.
   *
   * @param event Chat-feed event.
   * @returns Response DTO ready for SSE serialization.
   */
  static fromChatFeedEvent(event: ChatFeedEvent): GetChatFeedEventResponse {
    return {
      type: event.type,
      item: GetChatResponse.fromChat(event.item),
    };
  }
}
