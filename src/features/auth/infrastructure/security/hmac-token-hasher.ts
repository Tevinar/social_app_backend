import { Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { requireSecretFile } from '../../../../core/config/require-secret-file';
import { type TokenHasher } from '../../application/ports/tokens/token-hasher';

/**
 * Secret file that stores the key used to derive deterministic refresh-token
 * hashes.
 */
const TOKEN_HASH_SECRET_FILE_NAME = 'token_hash_secret.txt';

/**
 * Secret key used by the HMAC hasher to derive a stable storage value from a
 * raw token.
 */
const tokenHashSecret = requireSecretFile(TOKEN_HASH_SECRET_FILE_NAME);

/**
 * HMAC-backed implementation of the token hashing port.
 *
 * This adapter derives a deterministic digest from the raw refresh token so
 * the application can persist only the derived value instead of the token
 * itself.
 */
@Injectable()
export class HmacTokenHasher implements TokenHasher {
  /**
   * Hashes a token value using HMAC-SHA256 for secure persistence.
   *
   * @param value Raw token value.
   * @returns Hex-encoded HMAC digest of the provided token value.
   */
  hash(value: string): Promise<string> {
    return Promise.resolve(
      createHmac('sha256', tokenHashSecret).update(value).digest('hex'),
    );
  }
}
