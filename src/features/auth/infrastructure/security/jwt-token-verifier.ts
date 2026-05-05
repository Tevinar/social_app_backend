import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { requireSecretFile } from '../../../../core/config/require-secret-file';
import {
  type TokenClaims,
  type TokenVerifier,
} from '../../application/ports/tokens/token-verifier.port';

/**
 * Secret file that stores the HMAC key used to verify access tokens.
 */
const ACCESS_TOKEN_SECRET_FILE_NAME = 'jwt_access_secret.txt';

/**
 * Secret file that stores the HMAC key used to verify refresh tokens.
 */
const REFRESH_TOKEN_SECRET_FILE_NAME = 'jwt_refresh_secret.txt';

/**
 * Decoded access-token payload shape expected from a valid JWT.
 */
type AccessTokenPayload = {
  sid: string;
  sub: string;
  type: 'access';
};

/**
 * Decoded refresh-token payload shape expected from a valid JWT.
 */
type RefreshTokenPayload = {
  sid: string;
  sub: string;
  type: 'refresh';
};

/**
 * Access-token secret loaded from the local secrets directory.
 */
const accessTokenSecret = requireSecretFile(ACCESS_TOKEN_SECRET_FILE_NAME);

/**
 * Refresh-token secret loaded from the local secrets directory.
 */
const refreshTokenSecret = requireSecretFile(REFRESH_TOKEN_SECRET_FILE_NAME);

/**
 * Verifies that the decoded JWT payload contains the access-token claims
 * required by the application layer.
 *
 * @param value Decoded token payload to inspect.
 * @returns `true` when the payload contains a valid access-token shape.
 */
function hasVerifiedAccessTokenClaims(
  value: unknown,
): value is AccessTokenPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('sid' in value) || !('sub' in value) || !('type' in value)) {
    return false;
  }

  return (
    typeof value.sid === 'string' &&
    typeof value.sub === 'string' &&
    value.type === 'access'
  );
}

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
   * JWT service configured for access-token verification.
   */
  private readonly accessJwtService = new JwtService({
    secret: accessTokenSecret,
  });

  /**
   * JWT service configured for refresh-token verification.
   */
  private readonly refreshJwtService = new JwtService({
    secret: refreshTokenSecret,
  });

  /**
   * Verifies an access token and extracts the claims required by the
   * application layer.
   *
   * Invalid, expired, malformed, and wrong-type tokens all resolve to `null`
   * so the application layer can treat them as a single auth failure path.
   *
   * @param token Raw access token submitted by the client.
   * @returns Verified access-token claims, or `null` when verification fails.
   */
  async verifyAccessToken(token: string): Promise<TokenClaims | null> {
    try {
      const payload =
        await this.accessJwtService.verifyAsync<Record<string, unknown>>(token);

      if (!hasVerifiedAccessTokenClaims(payload)) {
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
  async verifyRefreshToken(token: string): Promise<TokenClaims | null> {
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
