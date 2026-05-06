import { Observable } from 'rxjs';
import { ChatMessageEvent } from '../../domain/events/chat-message.event';

export const CHAT_MESSAGE_EVENT_BUS = Symbol('CHAT_MESSAGE_EVENT_BUS');

/**
 * Application port used to publish and consume live chat-message events inside
 * one chat conversation.
 */
export interface ChatMessageEventBus {
  /**
   * Publishes one chat-message event to current subscribers.
   *
   * @param event Message event to broadcast.
   */
  publish(event: ChatMessageEvent): void;

  /**
   * Opens a live stream of message events scoped to one chat visible to the
   * caller.
   *
   * @param params Caller and chat scope used to open the stream.
   * @returns Observable message-event stream.
   */
  subscribe(
    params: SubscribeToChatMessageEventsParams,
  ): Observable<ChatMessageEvent>;
}

export type SubscribeToChatMessageEventsParams = {
  userId: string;
  chatId: string;
};
