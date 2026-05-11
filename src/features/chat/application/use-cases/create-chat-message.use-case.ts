import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { ChatListEvent } from '../../domain/events/chat-list.event';
import { ChatMessageListEvent } from '../../domain/events/chat-message-list.event';
import { ChatMessageContent } from '../../domain/value-objects/chat-message-content';
import {
  CHAT_LIST_EVENT_BUS,
  type ChatListEventBus,
} from '../ports/chat-list-event-bus.port';
import {
  CHAT_MESSAGE_CREATOR,
  CreateChatMessageRecordResultType,
  type ChatMessageCreator,
} from '../ports/chat-message-creator.port';
import {
  CHAT_MESSAGE_LIST_EVENT_BUS,
  type ChatMessageListEventBus,
} from '../ports/chat-message-list-event-bus.port';
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
 * - persist the message and resulting list update atomically
 * - return the created message payload immediately to the initiating client
 * - publish list and message events after the write succeeds
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
   * @param chatListEventBus Broadcasts chat-list events.
   * @param chatMessageEventBus Broadcasts chat-message events.
   */
  constructor(
    @Inject(CHAT_MESSAGE_CREATOR)
    private readonly chatMessageCreator: ChatMessageCreator,
    @Inject(CHAT_LIST_EVENT_BUS)
    private readonly chatListEventBus: ChatListEventBus,
    @Inject(CHAT_MESSAGE_LIST_EVENT_BUS)
    private readonly chatMessageEventBus: ChatMessageListEventBus,
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
  async execute(params: CreateChatMessageParams): Promise<ChatWriteResult> {
    const content = ChatMessageContent.from(params.content);

    const result = await this.chatMessageCreator.create({
      chatId: params.chatId,
      authorId: params.userId,
      content: content.value,
    });

    if (result.type === CreateChatMessageRecordResultType.CHAT_NOT_FOUND) {
      throw new ChatNotFoundError();
    }

    this.chatListEventBus.publish(ChatListEvent.chatUpdated(result.chat));
    this.chatMessageEventBus.publish(
      ChatMessageListEvent.messageAdded(
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
