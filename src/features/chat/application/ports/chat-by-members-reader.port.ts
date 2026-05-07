import { Chat } from '../../domain/entities/chat';

export const CHAT_BY_MEMBERS_READER = Symbol('CHAT_BY_MEMBERS_READER');

/**
 * Application port used to read one existing chat by its exact member set.
 */
export interface ChatByMembersReader {
  /**
   * Reads one existing chat matching the submitted member set.
   *
   * @param memberIds Validated full member set for the lookup.
   * @returns Matching chat when one exists, otherwise null.
   */
  findByMemberIds(memberIds: string[]): Promise<Chat | null>;
}
