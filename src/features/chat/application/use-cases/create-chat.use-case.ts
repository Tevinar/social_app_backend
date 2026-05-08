import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { ChatMessageContent } from '../../domain/value-objects/chat-message-content';
import { ChatMembers } from '../../domain/value-objects/chat-members';
import {
  CHAT_LIST_EVENT_BUS,
  type ChatListEventBus,
} from '../ports/chat-list-event-bus.port';
import {
  CHAT_MESSAGE_LIST_EVENT_BUS,
  type ChatMessageListEventBus,
} from '../ports/chat-message-list-event-bus.port';
import {
  CHAT_CREATOR,
  CreateChatRecordResultType,
  type ChatCreator,
} from '../ports/chat-creator.port';
import { ChatListEvent } from '../../domain/events/chat-list.event';
import { ChatMessageListEvent } from '../../domain/events/chat-message-list.event';
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
   * Receives the feature ports required to persist a new chat transactionally
   * and notify realtime subscribers after creation.
   *
   * @param chatCreator Persists the chat write set atomically.
   * @param chatListEventBus Broadcasts chat-list events.
   * @param chatMessageEventBus Broadcasts chat-message events.
   */
  constructor(
    @Inject(CHAT_CREATOR)
    private readonly chatCreator: ChatCreator,
    @Inject(CHAT_LIST_EVENT_BUS)
    private readonly chatListEventBus: ChatListEventBus,
    @Inject(CHAT_MESSAGE_LIST_EVENT_BUS)
    private readonly chatMessageEventBus: ChatMessageListEventBus,
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

    this.chatListEventBus.publish(ChatListEvent.chatAdded(result.chat));
    this.chatMessageEventBus.publish(
      ChatMessageListEvent.messageAdded(
        result.firstMessage,
        result.chat.members.map((member) => member.id),
      ),
    );

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
