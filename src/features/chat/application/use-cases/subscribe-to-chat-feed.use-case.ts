import { Inject, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { StreamUseCase } from '../../../../core/contracts/stream-use-case';
import { ChatFeedEvent } from '../../domain/events/chat-feed.event';
import {
  CHAT_FEED_EVENT_BUS,
  type ChatFeedEventBus,
} from '../ports/chat-feed-event-bus.port';

/**
 * Application use case that opens the live chat-feed event stream.
 */
@Injectable()
export class SubscribeToChatFeedUseCase implements StreamUseCase<
  string,
  ChatFeedEvent
> {
  /**
   * Receives the event bus that emits chat feed events.
   *
   * @param chatFeedEventBus Event stream used by chat feed subscribers.
   */
  constructor(
    @Inject(CHAT_FEED_EVENT_BUS)
    private readonly chatFeedEventBus: ChatFeedEventBus,
  ) {}

  /**
   * Opens the chat feed event stream.
   *
   * @param userId Caller scope used to open the stream.
   * @returns Observable stream of chat feed events.
   */
  execute(userId: string): Observable<ChatFeedEvent> {
    return this.chatFeedEventBus.subscribe(userId);
  }
}
