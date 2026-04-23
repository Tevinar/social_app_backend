export const PASSWORD_VERIFIER = Symbol('PASSWORD_VERIFIER');
/**
 * Application port used to verify a plaintext password against a stored hash.
 */
export interface PasswordVerifier {
  /**
   * Verifies whether the provided plaintext password matches the stored hash.
   *
   * @param plain User-submitted plaintext password.
   * @param hash Persisted password hash to compare against.
   * @returns `true` when the password matches, otherwise `false`.
   */
  verify(plain: string, hash: string): Promise<boolean>;
}
