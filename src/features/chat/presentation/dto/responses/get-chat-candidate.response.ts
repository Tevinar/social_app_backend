import { ChatCandidateModel } from '../../../application/models/chat-candidate.model';

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
   * Builds the response DTO from one application chat-candidate model.
   *
   * @param candidate Application chat-candidate model.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromChatCandidate(
    candidate: ChatCandidateModel,
  ): GetChatCandidateResponse {
    return {
      id: candidate.id,
      name: candidate.name,
    };
  }
}
