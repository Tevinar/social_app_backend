import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter } from 'rxjs';
import {
  PubSubRuntimeService,
  type PubSubTopicHandler,
} from '../../../../core/pubsub/pubsub-runtime.service';
import { type ChatListEventBus } from '../../application/ports/chat-list-event-bus.port';
import { ChatListEvent } from '../../domain/events/chat-list.event';
import { decodeChatListEvent } from './chat-realtime-event.codec';
import { CHAT_LIST_REALTIME_TOPIC } from './chat-realtime-topics';

/**
 * Pub/Sub-backed implementation of the chat-list event bus port.
 */
@Injectable()
export class PubSubChatListEventBus
  implements ChatListEventBus, PubSubTopicHandler
{
  readonly topicName = CHAT_LIST_REALTIME_TOPIC;

  private readonly subject = new Subject<ChatListEvent>();

  /**
   * Receives the shared Pub/Sub runtime and registers the chat-list topic
   * handler.
   *
   * @param pubsubRuntime Shared Pub/Sub runtime.
   */
  constructor(private readonly pubsubRuntime: PubSubRuntimeService) {
    this.pubsubRuntime.registerHandler(this);
  }

  /**
   * Opens one live chat-list stream filtered to the requested user.
   *
   * @param userId Caller scope used to open the stream.
   * @returns Observable list-event stream.
   */
  subscribe(userId: string): Observable<ChatListEvent> {
    return this.subject
      .asObservable()
      .pipe(
        filter((event) =>
          event.chat.members.some((member) => member.id === userId),
        ),
      );
  }

  /**
   * Decodes one consumed Pub/Sub payload and forwards it to local subscribers.
   *
   * @param payload Pub/Sub payload consumed from the chat-list topic.
   */
  handleMessage(payload: string): void {
    this.subject.next(decodeChatListEvent(payload));
  }
}
