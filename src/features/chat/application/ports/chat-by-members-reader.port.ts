import { Chat } from '../../domain/entities/chat';

export const CHAT_BY_MEMBERS_READER = Symbol('CHAT_BY_MEMBERS_READER');

/**
 * Application port used to read one existing chat by its exact participant
 * set.
 */
export interface ChatByMembersReader {
  /**
   * Reads one existing chat matching the submitted participant set.
   *
   * @param participantIds Validated full participant set for the lookup.
   * @returns Matching chat when one exists, otherwise null.
   */
  findByParticipantIds(participantIds: string[]): Promise<Chat | null>;
}
