export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

/**
 * Application port used to hash plaintext passwords before persistence.
 */
export interface PasswordHasher {
  /**
   * Hashes a plaintext password for secure storage.
   *
   * @param plain User-submitted plaintext password.
   * @returns The derived password hash to persist.
   */
  hash(plain: string): Promise<string>;
}
