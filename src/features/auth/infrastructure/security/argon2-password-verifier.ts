import { Injectable } from '@nestjs/common';
import { verify as verifyArgon2Hash } from 'argon2';
import { type PasswordVerifier } from '../../application/ports/credentials/password-verifier.port';

/**
 * Argon2-backed implementation of the password verification port.
 *
 * This adapter delegates password comparison to the `argon2` library so the
 * application layer depends only on the abstract `PasswordVerifier` contract.
 */
@Injectable()
export class Argon2PasswordVerifier implements PasswordVerifier {
  /**
   * Verifies a plaintext password against the stored Argon2 hash.
   *
   * @param plain User-submitted plaintext password.
   * @param hash Persisted Argon2 hash to compare against.
   * @returns `true` when the password matches the stored hash, otherwise `false`.
   */
  async verify(plain: string, hash: string): Promise<boolean> {
    return verifyArgon2Hash(hash, plain);
  }
}
