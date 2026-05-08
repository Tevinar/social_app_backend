import { Inject, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { StreamUseCase } from '../../../../core/contracts/stream-use-case';
import { ChatMessageListEvent } from '../../domain/events/chat-message-list.event';
import {
  CHAT_MESSAGE_LIST_EVENT_BUS,
  type ChatMessageListEventBus,
} from '../ports/chat-message-list-event-bus.port';

/**
 * Application use case that opens the live message-change stream for one chat
 * visible to the authenticated caller.
 */
@Injectable()
export class SubscribeToChatMessageListUseCase implements StreamUseCase<
  SubscribeToChatMessageListParams,
  ChatMessageListEvent
> {
  /**
   * Receives the event bus that emits scoped chat-message events.
   *
   * @param chatMessageListEventBus Event stream used by chat message subscribers.
   */
  constructor(
    @Inject(CHAT_MESSAGE_LIST_EVENT_BUS)
    private readonly chatMessageListEventBus: ChatMessageListEventBus,
  ) {}

  /**
   * Opens the chat-message event stream for the requested chat visible to the
   * caller.
   *
   * @param params Caller and chat scope used to open the stream.
   * @returns Observable stream of chat-message events.
   */
  execute(
    params: SubscribeToChatMessageListParams,
  ): Observable<ChatMessageListEvent> {
    return this.chatMessageListEventBus.subscribe({
      userId: params.userId,
      chatId: params.chatId,
    });
  }
}

export type SubscribeToChatMessageListParams = {
  userId: string;
  chatId: string;
};
