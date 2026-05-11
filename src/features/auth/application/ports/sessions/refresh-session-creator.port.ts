export const REFRESH_SESSION_CREATOR = Symbol('REFRESH_SESSION_CREATOR');

/**
 * Application port used to persist refresh session records.
 */
export interface RefreshSessionCreator {
  /**
   * Persists a newly issued refresh token session for a client device.
   *
   * Implementations are expected to store only the hashed token value rather
   * than the raw refresh token. When an active session already exists for the
   * same user/device pair, implementations should return a stable conflict
   * result instead of silently overwriting the existing session.
   *
   * @param params Refresh session data to persist.
   * @param params.id Stable identifier of the refresh session.
   * @param params.userId User that owns the refresh session.
   * @param params.deviceId App-scoped client device identifier.
   * @param params.tokenHash Hashed refresh token value.
   * @param params.expiresAt Expiration timestamp for the refresh session.
   * @returns The outcome of the session-creation attempt.
   */
  create(
    params: CreateRefreshSessionParams,
  ): Promise<CreateRefreshSessionResult>;
}

export type CreateRefreshSessionParams = {
  id: string;
  userId: string;
  deviceId: string;
  tokenHash: string;
  expiresAt: Date;
};

/**
 * Outcome of the refresh-session creation attempt.
 */
export enum CreateRefreshSessionResult {
  CREATED = 'created',
  ACTIVE_SESSION_CONFLICT = 'active_session_conflict',
}
