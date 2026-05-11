import { Inject, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { StreamUseCase } from '../../../../core/contracts/stream-use-case';
import { ChatListEvent } from '../../domain/events/chat-list.event';
import {
  CHAT_LIST_EVENT_BUS,
  type ChatListEventBus,
} from '../ports/chat-list-event-bus.port';

/**
 * Application use case that opens the live chat-list event stream.
 */
@Injectable()
export class SubscribeToChatListUseCase implements StreamUseCase<
  string,
  ChatListEvent
> {
  /**
   * Receives the event bus that emits chat list events.
   *
   * @param chatListEventBus Event stream used by chat list subscribers.
   */
  constructor(
    @Inject(CHAT_LIST_EVENT_BUS)
    private readonly chatListEventBus: ChatListEventBus,
  ) {}

  /**
   * Opens the chat list event stream.
   *
   * @param userId Caller scope used to open the stream.
   * @returns Observable stream of chat list events.
   */
  execute(userId: string): Observable<ChatListEvent> {
    return this.chatListEventBus.subscribe(userId);
  }
}
