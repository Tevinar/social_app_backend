import { Observable } from 'rxjs';
import { ChatListEvent } from '../../domain/events/chat-list.event';

export const CHAT_LIST_EVENT_BUS = Symbol('CHAT_LIST_EVENT_BUS');

/**
 * Application port used to publish and consume chat list events.
 */
export interface ChatListEventBus {
  /**
   * Publishes one chat list event to current subscribers.
   *
   * @param event List event to broadcast.
   */
  publish(event: ChatListEvent): Promise<void>;

  /**
   * Opens a live stream of chat list events.
   *
   * @param userId Caller scope used to open the stream.
   * @returns Observable list-event stream.
   */
  subscribe(userId: string): Observable<ChatListEvent>;
}
