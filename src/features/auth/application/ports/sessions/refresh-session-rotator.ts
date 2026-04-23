export const REFRESH_SESSION_ROTATOR = Symbol('REFRESH_SESSION_ROTATOR');

/**
 * Application port used to rotate the stored refresh token for a session.
 */
export interface RefreshSessionRotator {
  /**
   * Replaces the stored refresh-token hash for an existing session.
   *
   * Implementations should persist the new hash and expiration atomically so
   * the previous refresh token can no longer be used after rotation succeeds.
   *
   * @param params Rotation data to persist.
   * @param params.id Refresh session identifier to rotate.
   * @param params.tokenHash Hash of the newly issued refresh token.
   * @param params.expiresAt Expiration timestamp of the newly issued refresh
   * token.
   */
  rotate(params: RotateRefreshSessionParams): Promise<void>;
}

/**
 * Data required to rotate the token bound to a refresh session.
 */
export type RotateRefreshSessionParams = {
  id: string;
  tokenHash: string;
  expiresAt: Date;
};
