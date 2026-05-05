import { type ChatCandidatesSliceResponse } from '../../../application/use-cases/get-chat-candidates-slice.use-case';
import { GetChatCandidateResponse } from './get-chat-candidate.response';

/**
 * HTTP response body returned by the cursor-based get-chat-candidates-slice
 * endpoint.
 */
export class GetChatCandidatesSliceResponse {
  /**
   * Chat candidates in the current slice.
   */
  items!: GetChatCandidateResponse[];

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
  static fromChatCandidatesSlice(
    slice: ChatCandidatesSliceResponse,
  ): GetChatCandidatesSliceResponse {
    return {
      items: slice.items.map((candidate) =>
        GetChatCandidateResponse.fromChatCandidate(candidate),
      ),
      ...(slice.nextCursor ? { nextCursor: slice.nextCursor } : {}),
    };
  }
}
