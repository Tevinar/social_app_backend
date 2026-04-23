/**
 * Persisted refresh session state required to evaluate whether a refresh token
 * may still be used.
 */
export type RefreshSessionSnapshot = {
  id: string;
  userId: string;
  deviceId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

/**
 * Data presented by a caller attempting to refresh an existing session.
 */
export type RefreshSessionUsageAttempt = {
  userId: string;
  deviceId: string;
  tokenHash: string;
  now: Date;
};

/**
 * Domain entity that owns refresh-session validity rules.
 *
 * The entity is intentionally persistence-agnostic: it only evaluates the
 * session state it receives and does not know how tokens are signed, stored, or
 * loaded.
 */
export class RefreshSession {
  /**
   * Rehydrates a refresh session from persisted state.
   *
   * @param snapshot Persisted refresh session data.
   * @returns A domain refresh-session entity.
   */
  static fromSnapshot(snapshot: RefreshSessionSnapshot): RefreshSession {
    return new RefreshSession(snapshot);
  }

  /**
   * Stores the immutable snapshot used by refresh-session rule checks.
   *
   * @param snapshot Persisted refresh session data.
   */
  private constructor(private readonly snapshot: RefreshSessionSnapshot) {}

  /**
   * Stable identifier of the server-side refresh session.
   *
   * @returns Refresh session identifier.
   */
  get id(): string {
    return this.snapshot.id;
  }

  /**
   * Evaluates whether the presented refresh-token data may renew this session.
   *
   * @param attempt User, token hash, and timestamp for the refresh attempt.
   * @returns `true` when the session is active, owned by the same user, and the
   * presented token matches the stored token hash.
   */
  canBeRefreshedWith(attempt: RefreshSessionUsageAttempt): boolean {
    return (
      this.belongsTo(attempt.userId) &&
      this.belongsToDevice(attempt.deviceId) &&
      this.matchesTokenHash(attempt.tokenHash) &&
      this.isActiveAt(attempt.now)
    );
  }

  /**
   * Checks whether the session belongs to the expected user.
   *
   * @param userId User identifier to compare with the session owner.
   * @returns `true` when the identifiers match.
   */
  private belongsTo(userId: string): boolean {
    return this.snapshot.userId === userId;
  }

  /**
   * Checks whether the session belongs to the expected client device.
   *
   * @param deviceId Device identifier to compare with the session device.
   * @returns `true` when the identifiers match.
   */
  private belongsToDevice(deviceId: string): boolean {
    return this.snapshot.deviceId === deviceId;
  }

  /**
   * Checks whether the presented token hash is the currently stored value.
   *
   * @param tokenHash Hashed refresh token presented by the caller.
   * @returns `true` when the hashes match.
   */
  private matchesTokenHash(tokenHash: string): boolean {
    return this.snapshot.tokenHash === tokenHash;
  }

  /**
   * Checks whether the session is not revoked and has not expired.
   *
   * @param now Current timestamp used for expiration comparison.
   * @returns `true` when the session may still be used.
   */
  private isActiveAt(now: Date): boolean {
    return (
      this.snapshot.revokedAt === null &&
      this.snapshot.expiresAt.getTime() > now.getTime()
    );
  }
}
