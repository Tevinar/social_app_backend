/**
 * Domain entity that owns refresh-session validity rules.
 *
 * The entity is intentionally persistence-agnostic: it only evaluates the
 * session state it receives and does not know how tokens are signed, stored, or
 * loaded.
 */
export class RefreshSession {
  /**
   * Creates one immutable refresh-session entity.
   *
   * @param params Refresh-session data.
   * @param params.id Stable refresh-session identifier.
   * @param params.userId Stable owner identifier.
   * @param params.deviceId Stable owning device identifier.
   * @param params.tokenHash Currently stored refresh-token hash.
   * @param params.expiresAt Session expiration timestamp.
   * @param params.revokedAt Revocation timestamp when already revoked.
   * @returns A domain refresh-session entity.
   */
  static create(params: {
    id: string;
    userId: string;
    deviceId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
  }): RefreshSession {
    return new RefreshSession(
      params.id,
      params.userId,
      params.deviceId,
      params.tokenHash,
      params.expiresAt,
      params.revokedAt,
    );
  }

  /**
   * Stores immutable refresh-session state used by rule checks.
   *
   * @param id Stable refresh-session identifier.
   * @param userId Stable owner identifier.
   * @param deviceId Stable owning device identifier.
   * @param tokenHash Currently stored refresh-token hash.
   * @param expiresAt Session expiration timestamp.
   * @param revokedAt Revocation timestamp when already revoked.
   */
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly deviceId: string,
    readonly tokenHash: string,
    readonly expiresAt: Date,
    readonly revokedAt: Date | null,
  ) {}

  /**
   * Evaluates whether the presented refresh-token data may renew this session.
   *
   * @param attempt User, token hash, and timestamp for the refresh attempt.
   * @returns `true` when the session is active, owned by the same user, and the
   * presented token matches the stored token hash.
   */
  canBeRefreshedWith(attempt: RefreshSessionUsageAttempt): boolean {
    return this.matchesUsageAttempt(attempt) && this.isActiveAt(attempt.now);
  }

  /**
   * Evaluates whether the presented refresh-token data may revoke this session.
   *
   * @param attempt User, token hash, and timestamp for the sign-out attempt.
   * @returns `true` when the session is active, owned by the same user, and the
   * presented token matches the stored token hash.
   */
  canBeSignedOutWith(attempt: RefreshSessionUsageAttempt): boolean {
    return this.matchesUsageAttempt(attempt) && this.isActiveAt(attempt.now);
  }

  /**
   * Checks whether the session belongs to the expected user.
   *
   * @param userId User identifier to compare with the session owner.
   * @returns `true` when the identifiers match.
   */
  private belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Checks whether the session belongs to the expected client device.
   *
   * @param deviceId Device identifier to compare with the session device.
   * @returns `true` when the identifiers match.
   */
  private belongsToDevice(deviceId: string): boolean {
    return this.deviceId === deviceId;
  }

  /**
   * Checks whether the presented token hash is the currently stored value.
   *
   * @param tokenHash Hashed refresh token presented by the caller.
   * @returns `true` when the hashes match.
   */
  private matchesTokenHash(tokenHash: string): boolean {
    return this.tokenHash === tokenHash;
  }

  /**
   * Checks whether a presented usage attempt belongs to this session.
   *
   * @param attempt User, device, and token hash presented by the caller.
   * @returns `true` when the attempt matches the stored session ownership data.
   */
  private matchesUsageAttempt(attempt: RefreshSessionUsageAttempt): boolean {
    return (
      this.belongsTo(attempt.userId) &&
      this.belongsToDevice(attempt.deviceId) &&
      this.matchesTokenHash(attempt.tokenHash)
    );
  }

  /**
   * Checks whether the session is not revoked and has not expired.
   *
   * @param now Current timestamp used for expiration comparison.
   * @returns `true` when the session may still be used.
   */
  private isActiveAt(now: Date): boolean {
    return this.revokedAt === null && this.expiresAt.getTime() > now.getTime();
  }
}

/**
 * Data presented by a caller attempting to use an existing refresh session.
 */
export type RefreshSessionUsageAttempt = {
  userId: string;
  deviceId: string;
  tokenHash: string;
  now: Date;
};
