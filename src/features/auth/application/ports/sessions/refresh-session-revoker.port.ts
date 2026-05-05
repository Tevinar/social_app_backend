export const REFRESH_SESSION_REVOKER = Symbol('REFRESH_SESSION_REVOKER');

/**
 * Application port used to revoke an existing refresh session.
 */
export interface RefreshSessionRevoker {
  /**
   * Marks the targeted refresh session as revoked.
   *
   * Implementations should persist the revocation timestamp so future refresh
   * attempts against the same session are rejected.
   *
   * @param params Revocation data to persist.
   * @param params.id Refresh session identifier to revoke.
   * @param params.revokedAt Timestamp at which the session was revoked.
   */
  revoke(params: RevokeRefreshSessionParams): Promise<void>;
}

/**
 * Data required to revoke a refresh session.
 */
export type RevokeRefreshSessionParams = {
  id: string;
  revokedAt: Date;
};
