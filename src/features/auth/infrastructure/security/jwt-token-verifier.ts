import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { requireSecretFile } from '../../../../core/config/require-secret-file';
import {
  type TokenVerifier,
  type VerifiedRefreshToken,
} from '../../application/ports/tokens/token-verifier';

/**
 * Secret file that stores the HMAC key used to verify refresh tokens.
 */
const REFRESH_TOKEN_SECRET_FILE_NAME = 'jwt_refresh_secret.txt';

/**
 * Decoded refresh-token payload shape expected from a valid JWT.
 */
type RefreshTokenPayload = {
  sid: string;
  sub: string;
  type: 'refresh';
};

/**
 * Refresh-token secret loaded from the local secrets directory.
 */
const refreshTokenSecret = requireSecretFile(REFRESH_TOKEN_SECRET_FILE_NAME);

/**
 * Verifies that the decoded JWT payload contains the refresh-token claims
 * required by the application layer.
 *
 * @param value Decoded token payload to inspect.
 * @returns `true` when the payload contains a valid refresh-token shape.
 */
function hasVerifiedRefreshTokenClaims(
  value: unknown,
): value is RefreshTokenPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('sid' in value) || !('sub' in value) || !('type' in value)) {
    return false;
  }

  return (
    typeof value.sid === 'string' &&
    typeof value.sub === 'string' &&
    value.type === 'refresh'
  );
}

/**
 * JWT-backed implementation of the token verifier port.
 *
 * This adapter validates refresh-token signatures and extracts only the claims
 * the application layer needs to locate the backing server-side session.
 */
@Injectable()
export class JwtTokenVerifier implements TokenVerifier {
  /**
   * JWT service configured for refresh-token verification.
   */
  private readonly refreshJwtService = new JwtService({
    secret: refreshTokenSecret,
  });

  /**
   * Verifies a refresh token and extracts the claims required by the
   * application layer.
   *
   * Invalid, expired, malformed, and wrong-type tokens all resolve to `null`
   * so the application layer can treat them as a single auth failure path.
   *
   * @param token Raw refresh token submitted by the client.
   * @returns Verified refresh-token claims, or `null` when verification fails.
   */
  async verifyRefreshToken(
    token: string,
  ): Promise<VerifiedRefreshToken | null> {
    try {
      const payload =
        await this.refreshJwtService.verifyAsync<Record<string, unknown>>(
          token,
        );

      if (!hasVerifiedRefreshTokenClaims(payload)) {
        return null;
      }

      return {
        userId: payload.sub,
        sessionId: payload.sid,
      };
    } catch {
      return null;
    }
  }
}
