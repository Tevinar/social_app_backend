import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { ChatFeedItem } from '../../domain/entities/chat-feed-item';
import { ChatMessage } from '../../domain/entities/chat-message';
import { ChatMessageContent } from '../../domain/value-objects/chat-message-content';
import { ChatMembers } from '../../domain/value-objects/chat-members';
import {
  CHAT_FEED_EVENT_BUS,
  type ChatFeedEventBus,
} from '../ports/chat-feed-event-bus.port';
import {
  CHAT_MESSAGE_EVENT_BUS,
  type ChatMessageEventBus,
} from '../ports/chat-message-event-bus.port';
import {
  CHAT_CREATOR,
  CreateChatRecordResultType,
  type ChatCreator,
} from '../ports/chat-creator.port';
import { ChatFeedEvent } from '../../domain/events/chat-feed.event';
import { ChatMessageEvent } from '../../domain/events/chat-message.event';

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

/**
 * Application use case responsible for creating one new chat with its first
 * message.
 *
 * Responsibilities:
 * - normalize and validate the selected member ids
 * - validate the submitted first-message content
 * - persist the chat, its membership set, and first message atomically
 * - return the created chat payload immediately to the initiating client
 * - publish feed and message events after the write succeeds
 */
@Injectable()
export class CreateChatUseCase implements UseCase<
  CreateChatParams,
  CreateChatResult
> {
  /**
   * Receives the feature ports required to persist a new chat transactionally
   * and notify realtime subscribers after creation.
   *
   * @param chatCreator Persists the chat write set atomically.
   * @param chatFeedEventBus Broadcasts chat-feed events.
   * @param chatMessageEventBus Broadcasts chat-message events.
   */
  constructor(
    @Inject(CHAT_CREATOR)
    private readonly chatCreator: ChatCreator,
    @Inject(CHAT_FEED_EVENT_BUS)
    private readonly chatFeedEventBus: ChatFeedEventBus,
    @Inject(CHAT_MESSAGE_EVENT_BUS)
    private readonly chatMessageEventBus: ChatMessageEventBus,
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
  async execute(params: CreateChatParams): Promise<CreateChatResult> {
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

    this.chatFeedEventBus.publish(ChatFeedEvent.chatAdded(result.chatFeedItem));
    this.chatMessageEventBus.publish(
      ChatMessageEvent.messageAdded(
        result.firstMessage,
        result.chatFeedItem.members.map((member) => member.id),
      ),
    );

    return {
      chatFeedItem: result.chatFeedItem,
      firstMessage: result.firstMessage,
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

export type CreateChatResult = {
  chatFeedItem: ChatFeedItem;
  firstMessage: ChatMessage;
};
