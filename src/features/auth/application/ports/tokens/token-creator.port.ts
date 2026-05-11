export const TOKEN_CREATOR = Symbol('TOKEN_CREATOR');
/**
 * Application port used to create signed access and refresh tokens.
 *
 * In this authentication flow:
 * - an access token is the short-lived token sent with protected API requests
 * - a refresh token is the longer-lived token used to obtain a new access
 *   token without forcing the user to sign in again
 *
 * "Claims" refers to the data embedded inside the signed token payload, such as
 * the user identifier, session identifier, and expiration metadata.
 */
export interface TokenCreator {
  /**
   * Creates an access token for an authenticated user session.
   *
   * The resulting access token is intended to be presented on authenticated API
   * requests until it expires.
   *
   * @param params Access-token payload data and metadata.
   * @param params.userId Authenticated user identifier.
   * @param params.sessionId New session identifier bound to the token.
   * @returns The signed token and its expiration timestamp.
   */
  createAccessToken(params: {
    userId: string;
    sessionId: string;
  }): Promise<{ token: string; expiresAt: Date }>;

  /**
   * Creates a refresh token for an authenticated user session.
   *
   * The resulting refresh token is intended to be exchanged later for a new
   * access token after the current access token expires.
   *
   * @param params Refresh-token payload data and metadata.
   * @param params.userId Authenticated user identifier.
   * @param params.sessionId Refresh session identifier bound to the token.
   * @returns The signed token and its expiration timestamp.
   */
  createRefreshToken(params: {
    userId: string;
    sessionId: string;
  }): Promise<{ token: string; expiresAt: Date }>;
}
