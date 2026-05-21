import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { ChatMessageContent } from '../../domain/value-objects/chat-message-content';
import {
  CHAT_MESSAGE_CREATOR,
  CreateChatMessageRecordResultType,
  type ChatMessageCreator,
} from '../ports/chat-message-creator.port';
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
 * - persist the message, list update, and outbox rows atomically
 * - return the created message payload immediately to the initiating client
 * - let the background outbox publisher deliver live events after commit
 */
@Injectable()
export class CreateChatMessageUseCase implements UseCase<
  CreateChatMessageParams,
  ChatWriteResult
> {
  /**
   * Receives the feature port required to persist a new message
   * transactionally together with its durable realtime outbox rows.
   *
   * @param chatMessageCreator Persists the message write set atomically.
   */
  constructor(
    @Inject(CHAT_MESSAGE_CREATOR)
    private readonly chatMessageCreator: ChatMessageCreator,
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
