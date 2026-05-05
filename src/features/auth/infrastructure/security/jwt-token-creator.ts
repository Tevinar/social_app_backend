import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { requireSecretFile } from '../../../../core/config/require-secret-file';
import { type TokenCreator } from '../../application/ports/tokens/token-creator.port';
import { EnvVariable } from '../../../../core/config/env-variable';

/**
 * Secret file that stores the HMAC key used to sign access tokens.
 */
const ACCESS_TOKEN_SECRET_FILE_NAME = 'jwt_access_secret.txt';

/**
 * Secret file that stores the HMAC key used to sign refresh tokens.
 */
const REFRESH_TOKEN_SECRET_FILE_NAME = 'jwt_refresh_secret.txt';

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
 * Reads a required config value and parses it as a positive integer.
 *
 * @param configService Shared Nest config service.
 * @param name Name of the environment variable to read.
 * @returns The parsed positive integer value.
 */
function requirePositiveIntegerConfig(
  configService: ConfigService,
  name: string,
): number {
  const value = Number(configService.getOrThrow<string>(name));

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Configuration value ${name} must be a positive integer`);
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
   * Access-token lifetime expressed in seconds for `jsonwebtoken`.
   */
  private readonly accessTokenTtlSeconds: number;

  /**
   * Refresh-token lifetime expressed in seconds for `jsonwebtoken`.
   */
  private readonly refreshTokenTtlSeconds: number;

  /**
   * Creates the JWT adapter and validates the configured token lifetimes.
   *
   * @param configService Shared Nest config service used to resolve auth TTLs.
   */
  constructor(private readonly configService: ConfigService) {
    const accessTokenTtlMinutes = requirePositiveIntegerConfig(
      this.configService,
      EnvVariable.AuthAccessTtlMinutes,
    );
    const refreshTokenTtlDays = requirePositiveIntegerConfig(
      this.configService,
      EnvVariable.AuthRefreshTtlDays,
    );

    this.accessTokenTtlSeconds = accessTokenTtlMinutes * 60;
    this.refreshTokenTtlSeconds = refreshTokenTtlDays * 24 * 60 * 60;
  }

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
        expiresIn: this.accessTokenTtlSeconds,
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
        expiresIn: this.refreshTokenTtlSeconds,
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
