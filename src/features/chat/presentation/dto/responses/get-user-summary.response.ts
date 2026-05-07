import { UserSummary } from '../../../domain/entities/user-summary';

/**
 * HTTP response body representing one public user summary in the chat feature.
 */
export class GetUserSummaryResponse {
  /**
   * Stable user identifier.
   */
  id!: string;

  /**
   * Public user display name.
   */
  name!: string;

  /**
   * Builds the response DTO from one user-summary entity.
   *
   * @param userSummary User-summary entity.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromUserSummary(userSummary: UserSummary): GetUserSummaryResponse {
    return {
      id: userSummary.id,
      name: userSummary.name,
    };
  }
}
