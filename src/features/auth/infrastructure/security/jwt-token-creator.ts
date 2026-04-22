import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { requireEnv } from '../../../../core/config/require-env';
import { requireSecretFile } from '../../../../core/config/require-secret-file';
import { type TokenCreator } from '../../application/ports/token-creator';

/**
 * Secret file that stores the HMAC key used to sign access tokens.
 */
const ACCESS_TOKEN_SECRET_FILE_NAME = 'jwt_access_secret.txt';

/**
 * Secret file that stores the HMAC key used to sign refresh tokens.
 */
const REFRESH_TOKEN_SECRET_FILE_NAME = 'jwt_refresh_secret.txt';

/**
 * Environment variable that defines the access-token lifetime in minutes.
 */
const ACCESS_TOKEN_TTL_MINUTES_ENV_NAME = 'AUTH_ACCESS_TTL_MINUTES';

/**
 * Environment variable that defines the refresh-token lifetime in days.
 */
const REFRESH_TOKEN_TTL_DAYS_ENV_NAME = 'AUTH_REFRESH_TTL_DAYS';

/**
 * Decoded JWT payload shape required to derive the expiration timestamp from a
 * newly signed token.
 */
type JwtPayloadWithExpiration = {
  exp: number;
};

/**
 * Access-token claims embedded in the JWT payload.
 */
type AccessTokenClaims = {
  sid: string;
  type: 'access';
};

/**
 * Refresh-token claims embedded in the JWT payload.
 */
type RefreshTokenClaims = {
  sid: string;
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
 * Access-token lifetime expressed in minutes and validated at startup.
 */
const accessTokenTtlMinutes = requirePositiveIntegerEnv(
  ACCESS_TOKEN_TTL_MINUTES_ENV_NAME,
);

/**
 * Access-token lifetime expressed in seconds for `jsonwebtoken`.
 */
const accessTokenTtlSeconds = accessTokenTtlMinutes * 60;

/**
 * Refresh-token lifetime expressed in days and validated at startup.
 */
const refreshTokenTtlDays = requirePositiveIntegerEnv(
  REFRESH_TOKEN_TTL_DAYS_ENV_NAME,
);

/**
 * Refresh-token lifetime expressed in seconds for `jsonwebtoken`.
 */
const refreshTokenTtlSeconds = refreshTokenTtlDays * 24 * 60 * 60;

/**
 * Verifies that the decoded JWT payload contains a numeric `exp` claim.
 *
 * @param value Decoded token payload to inspect.
 * @returns `true` when the payload contains a valid expiration claim.
 */
function hasExpirationClaim(value: unknown): value is JwtPayloadWithExpiration {
  if (typeof value !== 'object' || value === null || !('exp' in value)) {
    return false;
  }

  return typeof value.exp === 'number';
}

/**
 * Reads a required environment variable and parses it as a positive integer.
 *
 * @param name Name of the environment variable to read.
 * @returns The parsed positive integer value.
 */
function requirePositiveIntegerEnv(name: string): number {
  const value = Number(requireEnv(name));

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return value;
}

/**
 * JWT-backed implementation of the token creator port.
 *
 * This adapter signs short-lived access tokens and longer-lived refresh tokens
 * with distinct secrets so the application layer stays isolated from JWT
 * library details and secret management.
 */
@Injectable()
export class JwtTokenCreator implements TokenCreator {
  /**
   * JWT service configured for access-token signing.
   */
  private readonly accessJwtService = new JwtService({
    secret: accessTokenSecret,
  });

  /**
   * JWT service configured for refresh-token signing.
   */
  private readonly refreshJwtService = new JwtService({
    secret: refreshTokenSecret,
  });

  /**
   * Creates a signed access token for an authenticated user session.
   *
   * @param params Access-token payload data.
   * @param params.userId Authenticated user identifier stored in `sub`.
   * @param params.sessionId Session identifier stored in the custom `sid` claim.
   * @returns The signed access token together with its expiration timestamp.
   */
  async createAccessToken(params: {
    userId: string;
    sessionId: string;
  }): Promise<{ token: string; expiresAt: Date }> {
    const token = await this.accessJwtService.signAsync<AccessTokenClaims>(
      {
        sid: params.sessionId,
        type: 'access',
      },
      {
        subject: params.userId,
        expiresIn: accessTokenTtlSeconds,
      },
    );

    return {
      token,
      expiresAt: this.getExpiresAt(token, this.accessJwtService),
    };
  }

  /**
   * Creates a signed refresh token for an authenticated user session.
   *
   * @param params Refresh-token payload data.
   * @param params.userId Authenticated user identifier stored in `sub`.
   * @param params.sessionId Session identifier stored in the custom `sid` claim.
   * @returns The signed refresh token together with its expiration timestamp.
   */
  async createRefreshToken(params: {
    userId: string;
    sessionId: string;
  }): Promise<{ token: string; expiresAt: Date }> {
    const token = await this.refreshJwtService.signAsync<RefreshTokenClaims>(
      {
        sid: params.sessionId,
        type: 'refresh',
      },
      {
        subject: params.userId,
        expiresIn: refreshTokenTtlSeconds,
      },
    );

    return {
      token,
      expiresAt: this.getExpiresAt(token, this.refreshJwtService),
    };
  }

  /**
   * Extracts the expiration timestamp from a token the adapter just signed.
   *
   * @param token Signed JWT string.
   * @param jwtService JWT service configured with the corresponding secret.
   * @returns Expiration timestamp embedded in the token.
   */
  private getExpiresAt(token: string, jwtService: JwtService): Date {
    const payload = jwtService.decode<unknown>(token);

    if (!hasExpirationClaim(payload)) {
      throw new Error('Signed JWT is missing a valid exp claim');
    }

    return new Date(payload.exp * 1000);
  }
}
