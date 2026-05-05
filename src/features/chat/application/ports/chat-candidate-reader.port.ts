import { ChatCandidate } from '../../domain/entities/chat-candidate';
import { type ChatCandidateCursor } from '../chat-candidate-cursor/chat-candidate-cursor';

export const CHAT_CANDIDATE_READER = Symbol('CHAT_CANDIDATE_READER');

/**
 * Application port used to read chat-creation candidates.
 */
export interface ChatCandidateReader {
  /**
   * Reads one recent slice of chat candidates ordered from most recent to
   * least recent.
   *
   * The current implementation returns all other registered users, but the
   * visibility policy is owned by the reader so it can later be restricted to
   * friends or other chat-eligible relationships without changing the use case.
   *
   * @param params Cursor window requested by the caller.
   * @returns Current slice of chat candidates.
   */
  findRecentSlice(
    params: FindRecentChatCandidatesSliceParams,
  ): Promise<RecentChatCandidatesSlice>;
}

export type FindRecentChatCandidatesSliceParams = {
  userId: string;
  limit: number;
  cursor?: ChatCandidateCursor;
};

export type RecentChatCandidatesSlice = {
  items: ChatCandidate[];
};
