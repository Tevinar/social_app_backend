import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { Chat } from '../../domain/entities/chat';
import { ChatParticipants } from '../../domain/value-objects/chat-participants';
import {
  CHAT_BY_MEMBERS_READER,
  type ChatByMembersReader,
} from '../ports/chat-by-members-reader.port';

/**
 * Application use case responsible for finding one existing chat by its exact
 * participant set.
 *
 * Responsibilities:
 * - normalize and validate the selected participant ids
 * - include the authenticated caller in the participant set automatically
 * - look up one existing chat matching the full participant set
 */
@Injectable()
export class GetChatByMembersUseCase implements UseCase<
  GetChatByMembersParams,
  Chat | null
> {
  /**
   * Receives the capability required to read chats by participant set.
   *
   * @param chatByMembersReader Reads one chat matching the submitted
   * participant set.
   */
  constructor(
    @Inject(CHAT_BY_MEMBERS_READER)
    private readonly chatByMembersReader: ChatByMembersReader,
  ) {}

  /**
   * Returns one existing chat matching the authenticated caller plus the
   * submitted other participants.
   *
   * @param params Lookup data submitted by the caller.
   * @returns Matching chat when found, otherwise null.
   * @throws {InvalidChatParticipantIdError} Thrown when one participant id is
   * malformed.
   * @throws {InvalidChatParticipantsError} Thrown when no other participant is
   * selected.
   */
  async execute(params: GetChatByMembersParams): Promise<Chat | null> {
    const participants = ChatParticipants.from(params.userId, params.members);

    return this.chatByMembersReader.findByParticipantIds(
      [...participants.participantIds].sort((left, right) =>
        left.localeCompare(right),
      ),
    );
  }
}

/**
 * Input required to read one existing chat by its participant set.
 */
export type GetChatByMembersParams = {
  userId: string;
  members: string[];
};
