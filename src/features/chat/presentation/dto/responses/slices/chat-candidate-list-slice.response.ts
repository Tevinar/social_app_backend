import { ChatCandidateListSliceResult } from '../../../../application/use-cases/get-chat-candidate-list-slice.use-case';
import { GetUserSummaryResponse } from '../common/get-user-summary.response';

/**
 * HTTP response body returned by the cursor-based get-chat-candidates-slice
 * endpoint.
 */
export class ChatCandidateListSliceResponse {
  /**
   * Chat candidates in the current slice.
   */
  candidates!: GetUserSummaryResponse[];

  /**
   * Opaque cursor to request the next slice, when available.
   */
  nextCursor?: string;

  /**
   * Builds the HTTP response DTO from the application-layer slice result.
   *
   * @param slice Cursor-based chat-candidate result returned by the use case.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromSlice(
    slice: ChatCandidateListSliceResult,
  ): ChatCandidateListSliceResponse {
    return {
      candidates: slice.items.map((candidate) =>
        GetUserSummaryResponse.fromUserSummary(candidate),
      ),
      ...(slice.nextCursor ? { nextCursor: slice.nextCursor } : {}),
    };
  }
}
