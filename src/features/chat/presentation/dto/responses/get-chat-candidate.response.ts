import { UserSummary } from '../../../domain/entities/user-summary';
import { GetUserSummaryResponse } from './get-user-summary.response';

/**
 * HTTP response body representing one chat candidate.
 */
export class GetChatCandidateResponse extends GetUserSummaryResponse {
  /**
   * Builds the response DTO from one chat-candidate entity.
   *
   * @param candidate Chat-candidate entity.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromChatCandidate(candidate: UserSummary): GetChatCandidateResponse {
    return GetUserSummaryResponse.fromUserSummary(
      candidate,
    ) as GetChatCandidateResponse;
  }
}
