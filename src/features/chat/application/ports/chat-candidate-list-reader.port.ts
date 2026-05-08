import { UserSummary } from '../../domain/entities/user-summary';
import { type ChatCandidateCursor } from '../pagination/chat-candidate.cursor';

export const CHAT_CANDIDATE_READER = Symbol('CHAT_CANDIDATE_READER');

/**
 * Application port used to read chat-creation candidates.
 */
export interface ChatCandidateListReader {
  /**
   * Reads one cursor-based slice of chat candidates.
   *
   * The current implementation returns all other registered users, but the
   * visibility policy is owned by the reader so it can later be restricted to
   * friends or other chat-eligible relationships without changing the use case.
   *
   * @param params Cursor window requested by the caller.
   * @returns Current slice of chat candidates.
   */
  findSlice(
    params: FindRecentChatCandidateListSliceParams,
  ): Promise<RecentChatCandidateListSlice>;
}

export type FindRecentChatCandidateListSliceParams = {
  userId: string;
  limit: number;
  cursor?: ChatCandidateCursor;
};

export type RecentChatCandidateListSlice = {
  items: UserSummary[];
};
