import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { Chat } from '../../domain/entities/chat';
import { ChatMembers } from '../../domain/value-objects/chat-members';
import {
  CHAT_BY_MEMBERS_READER,
  type ChatByMembersReader,
} from '../ports/chat-by-members-reader.port';

/**
 * Application use case responsible for finding one existing chat by its exact
 * member set.
 *
 * Responsibilities:
 * - normalize and validate the selected member ids
 * - include the authenticated caller in the member set automatically
 * - look up one existing chat matching the full member set
 */
@Injectable()
export class GetChatByMembersUseCase implements UseCase<
  GetChatByMembersParams,
  Chat | null
> {
  /**
   * Receives the capability required to read chats by member set.
   *
   * @param chatByMembersReader Reads one chat matching the submitted member
   * set.
   */
  constructor(
    @Inject(CHAT_BY_MEMBERS_READER)
    private readonly chatByMembersReader: ChatByMembersReader,
  ) {}

  /**
   * Returns one existing chat matching the authenticated caller plus the
   * submitted other members.
   *
   * @param params Lookup data submitted by the caller.
   * @returns Matching chat when found, otherwise null.
   * @throws {InvalidChatMemberIdError} Thrown when one member id is
   * malformed.
   * @throws {InvalidChatMembersError} Thrown when no other member is
   * selected.
   */
  async execute(params: GetChatByMembersParams): Promise<Chat | null> {
    const members = ChatMembers.from(params.userId, params.members);

    return this.chatByMembersReader.findByMemberIds(
      [...members.memberIds].sort((left, right) => left.localeCompare(right)),
    );
  }
}

/**
 * Input required to read one existing chat by its member set.
 */
export type GetChatByMembersParams = {
  userId: string;
  members: string[];
};
