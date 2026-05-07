import { ChatMessageEvent } from '../../../domain/events/chat-message.event';
import { GetChatMessageResponse } from './get-chat-message.response';

/**
 * SSE payload returned when one chat-message event is emitted.
 */
export class GetChatMessageEventResponse {
  /**
   * Stable chat-message event name.
   */
  type!: string;

  /**
   * Chat message carried by the event.
   */
  item!: GetChatMessageResponse;

  /**
   * Builds the event payload from one chat-message event.
   *
   * @param event Chat-message event.
   * @returns Response DTO ready for SSE serialization.
   */
  static fromChatMessageEvent(
    event: ChatMessageEvent,
  ): GetChatMessageEventResponse {
    return {
      type: event.type,
      item: GetChatMessageResponse.fromChatMessage(event.item),
    };
  }
}
