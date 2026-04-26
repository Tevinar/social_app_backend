import { Inject, Injectable, Logger } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { RefreshSession } from '../../domain/entities/refresh-session';
import { DeviceId } from '../../domain/value-objects/device-id';
import {
  REFRESH_SESSION_READER,
  type RefreshSessionReadModel,
  type RefreshSessionReader,
} from '../ports/sessions/refresh-session-reader';
import {
  REFRESH_SESSION_ROTATOR,
  type RefreshSessionRotator,
} from '../ports/sessions/refresh-session-rotator';
import {
  TOKEN_CREATOR,
  type TokenCreator,
} from '../ports/tokens/token-creator';
import { TOKEN_HASHER, type TokenHasher } from '../ports/tokens/token-hasher';
import {
  TOKEN_VERIFIER,
  type TokenVerifier,
} from '../ports/tokens/token-verifier';

/**
 * Signals that the submitted refresh token cannot renew a session.
 *
 * The use case throws this generic error for missing, expired, revoked,
 * mismatched, or invalid refresh tokens so callers do not leak which validation
 * step failed.
 */
export class InvalidRefreshTokenError extends Error {
  /**
   * Creates a stable refresh-token error message suitable for client-facing
   * authentication failures.
   */
  constructor() {
    super('Invalid refresh token');
  }
}

/**
 * Application use case responsible for renewing an authenticated session from
 * a refresh token.
 *
 * Responsibilities:
 * - verify the submitted refresh token
 * - load and validate the matching server-side refresh session and device id
 * - issue a new access token and rotated refresh token
 * - persist the rotated refresh-token hash
 */
@Injectable()
export class RefreshSessionUseCase implements UseCase<
  RefreshSessionParams,
  RefreshSessionResult
> {
  private readonly logger = new Logger(RefreshSessionUseCase.name);
  /**
   * Receives the ports required to validate and rotate refresh sessions.
   *
   * @param tokenVerifier Verifies refresh token signatures and claims.
   * @param refreshSessionReader Loads persisted refresh sessions.
   * @param tokenHasher Hashes refresh tokens for storage comparison.
   * @param tokenCreator Creates new access and refresh tokens.
   * @param refreshSessionRotator Persists the rotated refresh-token hash.
   */
  constructor(
    @Inject(TOKEN_VERIFIER)
    private readonly tokenVerifier: TokenVerifier,
    @Inject(REFRESH_SESSION_READER)
    private readonly refreshSessionReader: RefreshSessionReader,
    @Inject(TOKEN_HASHER)
    private readonly tokenHasher: TokenHasher,
    @Inject(TOKEN_CREATOR)
    private readonly tokenCreator: TokenCreator,
    @Inject(REFRESH_SESSION_ROTATOR)
    private readonly refreshSessionRotator: RefreshSessionRotator,
  ) {}

  /**
   * Refreshes an authenticated session from a valid refresh token.
   *
   * The submitted token is rotated on success, which means the old refresh
   * token should no longer be accepted after this use case completes. The caller
   * must also provide the same app-scoped device id that owns the session.
   *
   * @param params Refresh request submitted by the caller.
   * @returns Newly issued access and refresh tokens with their expiration
   * timestamps.
   * @throws {InvalidRefreshTokenError} Thrown when the refresh token or backing
   * session is invalid.
   */
  async execute(params: RefreshSessionParams): Promise<RefreshSessionResult> {
    const deviceId = DeviceId.from(params.deviceId);
    const claims = await this.tokenVerifier.verifyRefreshToken(
      params.refreshToken,
    );

    if (!claims) {
      this.logger.warn('Refresh token verification failed');
      throw new InvalidRefreshTokenError();
    }

    const session = RefreshSession.fromSnapshot(
      await this.findRefreshSessionSnapshot(claims.sessionId),
    );
    const presentedTokenHash = await this.tokenHasher.hash(params.refreshToken);

    if (
      !session.canBeRefreshedWith({
        userId: claims.userId,
        deviceId: deviceId.value,
        tokenHash: presentedTokenHash,
        now: new Date(),
      })
    ) {
      throw new InvalidRefreshTokenError();
    }

    const access = await this.tokenCreator.createAccessToken({
      userId: claims.userId,
      sessionId: session.id,
    });

    const refresh = await this.tokenCreator.createRefreshToken({
      userId: claims.userId,
      sessionId: session.id,
    });

    const rotatedRefreshTokenHash = await this.tokenHasher.hash(refresh.token);

    await this.refreshSessionRotator.rotate({
      id: session.id,
      tokenHash: rotatedRefreshTokenHash,
      expiresAt: refresh.expiresAt,
    });

    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshTokenExpiresAt: refresh.expiresAt,
    };
  }

  /**
   * Loads the refresh session snapshot or converts the missing-session path
   * into the use case's stable invalid-token error.
   *
   * @param sessionId Refresh session identifier extracted from the token.
   * @returns Persisted refresh session state.
   * @throws {InvalidRefreshTokenError} Thrown when no session exists.
   */
  private async findRefreshSessionSnapshot(
    sessionId: string,
  ): Promise<RefreshSessionReadModel> {
    const snapshot = await this.refreshSessionReader.findById(sessionId);

    if (!snapshot) {
      this.logger.warn('Refresh token verification failed');
      throw new InvalidRefreshTokenError();
    }

    return snapshot;
  }
}

/**
 * Input required to refresh an authenticated session.
 */
export type RefreshSessionParams = {
  refreshToken: string;
  deviceId: string;
};

/**
 * Token payload returned after a successful refresh.
 */
export type RefreshSessionResult = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
};
