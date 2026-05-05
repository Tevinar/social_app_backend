export const TOKEN_HASHER = Symbol('TOKEN_HASHER');

/**
 * Application port used to hash sensitive token values before persistence.
 */
export interface TokenHasher {
  /**
   * Hashes a token value for secure storage and later comparison.
   *
   * @param value Raw token value.
   * @returns A hashed representation of the provided token.
   */
  hash(value: string): Promise<string>;
}
