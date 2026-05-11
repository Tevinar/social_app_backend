import { Observable } from 'rxjs';
import { ChatMessageListEvent } from '../../domain/events/chat-message-list.event';

export const CHAT_MESSAGE_LIST_EVENT_BUS = Symbol(
  'CHAT_MESSAGE_LIST_EVENT_BUS',
);

/**
 * Application port used to publish and consume live chat-message list events
 * for one caller inside one chat.
 */
export interface ChatMessageListEventBus {
  /**
   * Publishes one chat-message event to current subscribers.
   *
   * @param event Message event to broadcast.
   */
  publish(event: ChatMessageListEvent): void;

  /**
   * Opens a live stream of message events visible to the caller inside one
   * chat.
   *
   * @param params Caller and chat scope used to open the stream.
   * @returns Observable message-event stream.
   */
  subscribe(
    params: SubscribeToChatMessageListParams,
  ): Observable<ChatMessageListEvent>;
}

export type SubscribeToChatMessageListParams = {
  userId: string;
  chatId: string;
};
