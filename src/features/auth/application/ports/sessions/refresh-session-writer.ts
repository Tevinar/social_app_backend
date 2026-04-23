export const REFRESH_SESSION_WRITER = Symbol('REFRESH_SESSION_WRITER');

/**
 * Application port used to persist refresh session records.
 */
export interface RefreshSessionWriter {
  /**
   * Persists a newly issued refresh token session for a client device.
   *
   * Implementations are expected to store only the hashed token value rather
   * than the raw refresh token. When a session already exists for the same
   * user/device pair, implementations should replace it so repeated sign-ins
   * from the same app installation do not accumulate stale active sessions.
   *
   * @param params Refresh session data to persist.
   * @param params.id Stable identifier of the refresh session.
   * @param params.userId User that owns the refresh session.
   * @param params.deviceId App-scoped client device identifier.
   * @param params.tokenHash Hashed refresh token value.
   * @param params.expiresAt Expiration timestamp for the refresh session.
   */
  create(params: CreateRefreshSessionParams): Promise<void>;
}

export type CreateRefreshSessionParams = {
  id: string;
  userId: string;
  deviceId: string;
  tokenHash: string;
  expiresAt: Date;
};
