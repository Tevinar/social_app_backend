export const REFRESH_SESSION_WRITER = Symbol('REFRESH_SESSION_WRITER');

/**
 * Application port used to persist refresh session records.
 */
export interface RefreshSessionWriter {
  /**
   * Persists a newly issued refresh token session.
   *
   * Implementations are expected to store only the hashed token value rather
   * than the raw refresh token.
   *
   * @param params Refresh session data to persist.
   * @param params.id Stable identifier of the refresh session.
   * @param params.userId User that owns the refresh session.
   * @param params.tokenHash Hashed refresh token value.
   * @param params.expiresAt Expiration timestamp for the refresh session.
   */
  create(params: CreateRefreshSessionParams): Promise<void>;
}

export type CreateRefreshSessionParams = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};
