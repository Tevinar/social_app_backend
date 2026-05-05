export const REFRESH_SESSION_READER = Symbol('REFRESH_SESSION_READER');

/**
 * Refresh session state returned by persistence for session-renewal checks.
 */
export type RefreshSessionReadModel = {
  id: string;
  userId: string;
  deviceId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

/**
 * Application port used to read refresh sessions from persistence.
 */
export interface RefreshSessionReader {
  /**
   * Finds a refresh session by its stable server-side identifier.
   *
   * Implementations should return `null` when the session does not exist rather
   * than throwing for the normal "not found" path.
   *
   * @param id Refresh session identifier embedded in the refresh token.
   * @returns The matching refresh session state, or `null` when none exists.
   */
  findById(id: string): Promise<RefreshSessionReadModel | null>;
}
