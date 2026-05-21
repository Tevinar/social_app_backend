import { Observable } from 'rxjs';
import { ChatListEvent } from '../../domain/events/chat-list.event';

export const CHAT_LIST_EVENT_BUS = Symbol('CHAT_LIST_EVENT_BUS');

/**
 * Application port used to consume live chat list events.
 */
export interface ChatListEventBus {
  /**
   * Opens a live stream of chat list events.
   *
   * @param userId Caller scope used to open the stream.
   * @returns Observable list-event stream.
   */
  subscribe(userId: string): Observable<ChatListEvent>;
}
