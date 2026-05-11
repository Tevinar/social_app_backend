import { Injectable } from '@nestjs/common';
import { argon2id, hash as hashWithArgon2 } from 'argon2';
import { type PasswordHasher } from '../../application/ports/credentials/password-hasher.port';

/**
 * Argon2-backed implementation of the password hashing port.
 *
 * This adapter derives a secure password hash before credentials are
 * persisted, keeping the application layer independent from the hashing
 * library and its configuration details.
 */
@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  /**
   * Hashes a plaintext password with Argon2id for secure storage.
   *
   * @param plain User-submitted plaintext password.
   * @returns The derived Argon2 hash to persist.
   */
  async hash(plain: string): Promise<string> {
    return hashWithArgon2(plain, {
      type: argon2id,
    });
  }
}
