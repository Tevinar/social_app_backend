import { ChatListEvent } from '../../../../domain/events/chat-list.event';
import { GetChatResponse } from '../common/get-chat.response';

/**
 * SSE payload returned when one chat-list event is emitted.
 */
export class GetChatListEventResponse {
  /**
   * Stable chat-list event name.
   */
  type!: string;

  /**
   * Chat-list item carried by the event.
   */
  chat!: GetChatResponse;

  /**
   * Builds the event payload from one chat-list event.
   *
   * @param event Chat-list event.
   * @returns Response DTO ready for SSE serialization.
   */
  static fromChatListEvent(event: ChatListEvent): GetChatListEventResponse {
    return {
      type: event.type,
      chat: GetChatResponse.fromChat(event.chat),
    };
  }
}
