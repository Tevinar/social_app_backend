export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER');

/**
 * Verified token claims needed by the application layer.
 */
export type TokenClaims = {
  userId: string;
  sessionId: string;
};

/**
 * Application port used to verify signed authentication tokens.
 */
export interface TokenVerifier {
  /**
   * Verifies an access token and returns the claims required by the
   * application layer.
   *
   * Implementations should return `null` for invalid, expired, or wrong-type
   * tokens rather than leaking token-parser errors into the application layer.
   *
   * @param token Raw access token submitted by the client.
   * @returns Verified access-token claims, or `null` when verification fails.
   */
  verifyAccessToken(token: string): Promise<TokenClaims | null>;

  /**
   * Verifies a refresh token and returns the claims required to find its
   * server-side session.
   *
   * Implementations should return `null` for invalid, expired, or wrong-type
   * tokens rather than leaking token-parser errors into the application layer.
   *
   * @param token Raw refresh token submitted by the client.
   * @returns Verified refresh-token claims, or `null` when verification fails.
   */
  verifyRefreshToken(token: string): Promise<TokenClaims | null>;
}
