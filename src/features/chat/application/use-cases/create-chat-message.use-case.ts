import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { ChatFeedEvent } from '../../domain/events/chat-feed.event';
import { ChatMessageEvent } from '../../domain/events/chat-message.event';
import { ChatMessageContent } from '../../domain/value-objects/chat-message-content';
import {
  CHAT_FEED_EVENT_BUS,
  type ChatFeedEventBus,
} from '../ports/chat-feed-event-bus.port';
import {
  CHAT_MESSAGE_CREATOR,
  CreateChatMessageRecordResultType,
  type ChatMessageCreator,
} from '../ports/chat-message-creator.port';
import {
  CHAT_MESSAGE_EVENT_BUS,
  type ChatMessageEventBus,
} from '../ports/chat-message-event-bus.port';
import { ChatWriteResult } from './results/chat-write.result';

/**
 * Signals that the requested chat does not exist or is not visible to the
 * caller.
 */
export class ChatNotFoundError extends Error {
  /**
   * Creates a stable chat-not-found error message suitable for client-facing
   * write failures.
   */
  constructor() {
    super('Chat not found');
  }
}

/**
 * Application use case responsible for creating one new message inside an
 * existing chat.
 *
 * Responsibilities:
 * - validate the submitted message content
 * - persist the message and resulting feed update atomically
 * - return the created message payload immediately to the initiating client
 * - publish feed and message events after the write succeeds
 */
@Injectable()
export class CreateChatMessageUseCase implements UseCase<
  CreateChatMessageParams,
  ChatWriteResult
> {
  /**
   * Receives the feature ports required to persist a new message
   * transactionally and notify realtime subscribers after creation.
   *
   * @param chatMessageCreator Persists the message write set atomically.
   * @param chatFeedEventBus Broadcasts chat-feed events.
   * @param chatMessageEventBus Broadcasts chat-message events.
   */
  constructor(
    @Inject(CHAT_MESSAGE_CREATOR)
    private readonly chatMessageCreator: ChatMessageCreator,
    @Inject(CHAT_FEED_EVENT_BUS)
    private readonly chatFeedEventBus: ChatFeedEventBus,
    @Inject(CHAT_MESSAGE_EVENT_BUS)
    private readonly chatMessageEventBus: ChatMessageEventBus,
  ) {}

  /**
   * Creates one new message for the authenticated caller inside the target
   * chat.
   *
   * @param params Message data submitted by the caller.
   * @returns The created message payload ready for immediate client display.
   * @throws {InvalidChatMessageContentError} Thrown when the message is blank.
   * @throws {ChatNotFoundError} Thrown when the target chat is missing or not
   * visible to the caller.
   */
  async execute(
    params: CreateChatMessageParams,
  ): Promise<ChatWriteResult> {
    const content = ChatMessageContent.from(params.content);

    const result = await this.chatMessageCreator.create({
      chatId: params.chatId,
      authorId: params.userId,
      content: content.value,
    });

    if (result.type === CreateChatMessageRecordResultType.CHAT_NOT_FOUND) {
      throw new ChatNotFoundError();
    }

    this.chatFeedEventBus.publish(ChatFeedEvent.chatUpdated(result.chat));
    this.chatMessageEventBus.publish(
      ChatMessageEvent.messageAdded(
        result.chatMessage,
        result.chat.members.map((member) => member.id),
      ),
    );

    return {
      chat: result.chat,
      chatMessage: result.chatMessage,
    };
  }
}

/**
 * Input required to create one new chat message.
 */
export type CreateChatMessageParams = {
  userId: string;
  chatId: string;
  content: string;
};
