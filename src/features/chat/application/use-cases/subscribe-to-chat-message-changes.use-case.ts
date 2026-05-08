import { Inject, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { StreamUseCase } from '../../../../core/contracts/stream-use-case';
import { ChatMessageListEvent } from '../../domain/events/chat-message-list.event';
import {
  CHAT_MESSAGE_LIST_EVENT_BUS,
  type ChatMessageListEventBus,
} from '../ports/chat-message-list-event-bus.port';

/**
 * Application use case that opens the live message-change stream across all
 * chats visible to the authenticated caller.
 */
@Injectable()
export class SubscribeToChatMessageChangesUseCase implements StreamUseCase<
  string,
  ChatMessageListEvent
> {
  /**
   * Receives the event bus that emits scoped chat-message events.
   *
   * @param chatMessageEventBus Event stream used by chat message subscribers.
   */
  constructor(
    @Inject(CHAT_MESSAGE_LIST_EVENT_BUS)
    private readonly chatMessageEventBus: ChatMessageListEventBus,
  ) {}

  /**
   * Opens the chat-message event stream across all chats visible to the
   * caller.
   *
   * @param userId Caller scope used to open the stream.
   * @returns Observable stream of chat-message events.
   */
  execute(userId: string): Observable<ChatMessageListEvent> {
    return this.chatMessageEventBus.subscribe(userId);
  }
}
