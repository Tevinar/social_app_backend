import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { ChatMessageContent } from '../../domain/value-objects/chat-message-content';
import { ChatParticipants } from '../../domain/value-objects/chat-participants';
import {
  CHAT_CREATOR,
  CreateChatRecordResult,
  type ChatCreator,
} from '../ports/chat-creator.port';

/**
 * Signals that one requested chat participant does not exist.
 */
export class ChatParticipantNotFoundError extends Error {
  /**
   * Creates a stable chat-participant error message suitable for client-facing
   * missing-user failures.
   */
  constructor() {
    super('Chat participant not found');
  }
}

/**
 * Application use case responsible for creating one new chat with its first
 * message.
 *
 * Responsibilities:
 * - normalize and validate the selected participant ids
 * - validate the submitted first-message content
 * - create stable identifiers for the chat and its first message
 * - persist the chat, its membership set, and first message atomically
 */
@Injectable()
export class CreateChatUseCase implements UseCase<CreateChatParams, void> {
  /**
   * Receives the feature port required to persist a new chat transactionally.
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
   * The caller supplies the other chat participants explicitly. The creator is
   * always included automatically in the persisted membership set.
   *
   * @param params Chat data submitted by the caller.
   * @returns Identifier of the newly created chat.
   * @throws {InvalidChatParticipantIdError} Thrown when one participant id is
   * malformed.
   * @throws {InvalidChatParticipantsError} Thrown when no other participant is
   * selected.
   * @throws {InvalidChatMessageContentError} Thrown when the first message is
   * blank.
   * @throws {ChatParticipantNotFoundError} Thrown when one requested
   * participant does not exist.
   */
  async execute(params: CreateChatParams): Promise<void> {
    const participants = ChatParticipants.from(params.userId, params.members);
    const firstMessageContent = ChatMessageContent.from(
      params.firstMessageContent,
    );

    const result = await this.chatCreator.create({
      participantIds: participants.participantIds,
      firstMessageAuthorId: participants.creatorId,
      firstMessageContent: firstMessageContent.value,
    });

    if (result === CreateChatRecordResult.PARTICIPANT_NOT_FOUND) {
      throw new ChatParticipantNotFoundError();
    }
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
