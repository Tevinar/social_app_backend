import { RefreshSessionResult } from '../../../application/use-cases/refresh-session';

/**
 * HTTP response body returned after a successful session refresh.
 *
 * The DTO exposes expiration timestamps as ISO strings so the transport shape
 * matches the JSON representation sent over HTTP.
 */
export class RefreshSessionResponse {
  /**
   * Newly issued access token.
   */
  accessToken!: string;

  /**
   * Newly issued refresh token.
   */
  refreshToken!: string;

  /**
   * Access-token expiration timestamp serialized as an ISO string.
   */
  accessTokenExpiresAt!: string;

  /**
   * Refresh-token expiration timestamp serialized as an ISO string.
   */
  refreshTokenExpiresAt!: string;

  /**
   * Builds the HTTP response DTO from the application-layer refresh result.
   *
   * @param result Token payload returned by the refresh-session use case.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromRefreshSessionResult(
    result: RefreshSessionResult,
  ): RefreshSessionResponse {
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: result.refreshTokenExpiresAt.toISOString(),
    };
  }
}
