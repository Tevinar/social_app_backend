import { UserSummary } from '../../../domain/entities/user-summary';

/**
 * HTTP response body representing one chat candidate.
 */
export class GetChatCandidateResponse {
  /**
   * Stable chat-candidate identifier.
   */
  id!: string;

  /**
   * Public candidate display name.
   */
  name!: string;

  /**
   * Builds the response DTO from one chat-candidate entity.
   *
   * @param candidate Chat-candidate entity.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromChatCandidate(candidate: UserSummary): GetChatCandidateResponse {
    return {
      id: candidate.id,
      name: candidate.name,
    };
  }
}
