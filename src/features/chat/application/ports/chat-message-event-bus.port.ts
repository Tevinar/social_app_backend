import { Observable } from 'rxjs';
import { ChatMessageEvent } from '../../domain/events/chat-message.event';

export const CHAT_MESSAGE_EVENT_BUS = Symbol('CHAT_MESSAGE_EVENT_BUS');

/**
 * Application port used to publish and consume live chat-message events across
 * all chats visible to one caller.
 */
export interface ChatMessageEventBus {
  /**
   * Publishes one chat-message event to current subscribers.
   *
   * @param event Message event to broadcast.
   */
  publish(event: ChatMessageEvent): void;

  /**
   * Opens a live stream of message events visible to the caller across all of
   * their chats.
   *
   * @param userId Caller scope used to open the stream.
   * @returns Observable message-event stream.
   */
  subscribe(userId: string): Observable<ChatMessageEvent>;
}
