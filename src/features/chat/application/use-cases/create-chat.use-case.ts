import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { ChatMessageContent } from '../../domain/value-objects/chat-message-content';
import { ChatMembers } from '../../domain/value-objects/chat-members';
import {
  CHAT_CREATOR,
  CreateChatRecordResultType,
  type ChatCreator,
} from '../ports/chat-creator.port';
import { ChatWriteResult } from './results/chat-write.result';

/**
 * Application use case responsible for creating one new chat with its first
 * message.
 */
@Injectable()
export class CreateChatUseCase implements UseCase<
  CreateChatParams,
  ChatWriteResult
> {
  /**
   * Receives the feature port required to persist a new chat transactionally
   * together with its durable realtime outbox rows.
   *
   * @param chatCreator Persists the chat write set atomically.
   */
  constructor(
    @Inject(CHAT_CREATOR)
    private readonly chatCreator: ChatCreator,
  ) {}

  /**
   * Creates one new chat for the authenticated caller.
   *
   * The caller supplies the other chat members explicitly. The creator is
   * always included automatically in the persisted membership set.
   *
   * @param params Chat data submitted by the caller.
   * @returns The created chat payload ready for immediate client display.
   * @throws {InvalidChatMemberIdError} Thrown when one member id is
   * malformed.
   * @throws {InvalidChatMembersError} Thrown when no other member is
   * selected.
   * @throws {InvalidChatMessageContentError} Thrown when the first message is
   * blank.
   * @throws {ChatMemberNotFoundError} Thrown when one requested member does not
   * exist.
   */
  async execute(params: CreateChatParams): Promise<ChatWriteResult> {
    const members = ChatMembers.from(params.userId, params.members);
    const firstMessageContent = ChatMessageContent.from(
      params.firstMessageContent,
    );

    const result = await this.chatCreator.create({
      memberIds: members.memberIds,
      firstMessageAuthorId: members.creatorId,
      firstMessageContent: firstMessageContent.value,
    });

    if (result.type === CreateChatRecordResultType.MEMBER_NOT_FOUND) {
      throw new ChatMemberNotFoundError();
    }

    return {
      chat: result.chat,
      chatMessage: result.firstMessage,
    };
  }
}

/**
 * Input required to create one new chat.
 */
export type CreateChatParams = {
  userId: string;
  members: string[];
  firstMessageContent: string;
};

/**
 * Signals that one requested chat member does not exist.
 */
export class ChatMemberNotFoundError extends Error {
  /**
   * Creates a stable chat-member error message suitable for client-facing
   * missing-user failures.
   */
  constructor() {
    super('Chat member not found');
  }
}
