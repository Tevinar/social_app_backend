import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { RefreshSession } from '../../domain/entities/refresh-session';
import { DeviceId } from '../../domain/value-objects/device-id';
import {
  REFRESH_SESSION_READER,
  type RefreshSessionReader,
} from '../ports/sessions/refresh-session-reader';
import {
  REFRESH_SESSION_REVOKER,
  type RefreshSessionRevoker,
} from '../ports/sessions/refresh-session-revoker';
import { TOKEN_HASHER, type TokenHasher } from '../ports/tokens/token-hasher';
import {
  TOKEN_VERIFIER,
  type TokenVerifier,
} from '../ports/tokens/token-verifier';

/**
 * Application use case responsible for revoking the current refresh session.
 *
 * Responsibilities:
 * - verify the submitted refresh token when possible
 * - load the matching server-side refresh session and device id
 * - revoke the session when the token, user, and device match an active session
 *
 * This use case is intentionally idempotent: missing, expired, revoked,
 * mismatched, or otherwise invalid refresh-session data resolves to success so
 * callers can always complete local sign-out without learning server-side
 * session details.
 */
@Injectable()
export class SignOutCurrentSessionUseCase implements UseCase<
  SignOutCurrentSessionParams,
  void
> {
  /**
   * Receives the ports required to validate and revoke refresh sessions.
   *
   * @param tokenVerifier Verifies refresh token signatures and claims.
   * @param refreshSessionReader Loads persisted refresh sessions.
   * @param tokenHasher Hashes refresh tokens for storage comparison.
   * @param refreshSessionRevoker Persists session revocation.
   */
  constructor(
    @Inject(TOKEN_VERIFIER)
    private readonly tokenVerifier: TokenVerifier,
    @Inject(REFRESH_SESSION_READER)
    private readonly refreshSessionReader: RefreshSessionReader,
    @Inject(TOKEN_HASHER)
    private readonly tokenHasher: TokenHasher,
    @Inject(REFRESH_SESSION_REVOKER)
    private readonly refreshSessionRevoker: RefreshSessionRevoker,
  ) {}

  /**
   * Revokes the current refresh session when the submitted token still maps to
   * an active session owned by the same device.
   *
   * @param params Sign-out request submitted by the caller.
   */
  async execute(params: SignOutCurrentSessionParams): Promise<void> {
    const deviceId = DeviceId.from(params.deviceId);
    const claims = await this.tokenVerifier.verifyRefreshToken(
      params.refreshToken,
    );

    if (!claims) {
      return;
    }

    const snapshot = await this.refreshSessionReader.findById(claims.sessionId);

    if (!snapshot) {
      return;
    }

    const now = new Date();
    const session = RefreshSession.fromSnapshot(snapshot);
    const presentedTokenHash = await this.tokenHasher.hash(params.refreshToken);

    if (
      !session.canBeSignedOutWith({
        userId: claims.userId,
        deviceId: deviceId.value,
        tokenHash: presentedTokenHash,
        now,
      })
    ) {
      return;
    }

    await this.refreshSessionRevoker.revoke({
      id: session.id,
      revokedAt: now,
    });
  }
}

/**
 * Input required to revoke the caller's current refresh session.
 */
export type SignOutCurrentSessionParams = {
  refreshToken: string;
  deviceId: string;
};
