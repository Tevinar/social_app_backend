/**
 * Authentication user record required by the sign-in flow.
 *
 * This is an application-layer data shape returned by auth persistence ports.
 * It contains the minimum fields needed to verify credentials and build the
 * authenticated response.
 */
export type AuthUser = {
  /** Stable user identifier. */
  id: string;
  /** User email used for authentication. */
  email: string;
  /** Persisted password hash used for password verification. */
  passwordHash: string;
  /** Public profile name exposed by the authenticated session payload. */
  name: string;
  /** Timestamp at which the email address was verified, when applicable. */
  emailVerifiedAt: Date | null;
};

export const AUTH_USER_READER = Symbol('AUTH_USER_READER');
/**
 * Application port used to read authentication users from persistence.
 */
export interface AuthUserReader {
  /**
   * Finds a user by email for credential verification.
   *
   * Implementations should return `null` when the email is unknown rather than
   * throwing for the normal "user not found" path.
   *
   * @param email Normalized email address to look up.
   * @returns The matching auth user record, or `null` when no user exists.
   */
  findByEmail(email: string): Promise<AuthUser | null>;
}
