import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import {
  TOKEN_VERIFIER,
  type TokenClaims,
  type TokenVerifier,
} from '../ports/tokens/token-verifier.port';
import {
  REFRESH_SESSION_READER,
  type RefreshSessionReader,
} from '../ports/sessions/refresh-session-reader.port';
import { RefreshSession } from '../../domain/entities/refresh-session';

/**
 * Application use case responsible for validating a submitted access token.
 *
 * Responsibilities:
 * - verify the submitted access token signature and claims
 * - load the backing server-side session for the submitted token
 * - reject tokens whose session is missing, expired, or revoked
 * - expose the validated token identity to callers that need the authenticated
 *   user and session identifiers
 */
@Injectable()
export class ValidateAccessTokenUseCase implements UseCase<
  string,
  TokenClaims
> {
  /**
   * Receives the token-verification capability required by the use case.
   *
   * @param tokenVerifier Verifies access token signatures and claims.
   * @param refreshSessionReader Loads the server-side session tied to the token.
   */
  constructor(
    @Inject(TOKEN_VERIFIER)
    private readonly tokenVerifier: TokenVerifier,
    @Inject(REFRESH_SESSION_READER)
    private readonly refreshSessionReader: RefreshSessionReader,
  ) {}

  /**
   * Validates an access token and returns its authenticated identity claims.
   *
   * @param accessToken Raw access token submitted by the caller.
   * @returns Validated user and session identifiers extracted from the token.
   * @throws {InvalidAccessTokenError} Thrown when the access token is invalid.
   */
  async execute(accessToken: string): Promise<TokenClaims> {
    // Verify the JWT itself and extract the identity claims it carries.
    const claims = await this.tokenVerifier.verifyAccessToken(accessToken);

    if (!claims) {
      throw new InvalidAccessTokenError();
    }

    // Load the server-side session referenced by the token's `sid`.
    const snapshot = await this.refreshSessionReader.findById(claims.sessionId);
    if (!snapshot) throw new InvalidAccessTokenError();

    // Hydrate the domain session entity so validation rules stay in the
    // domain instead of being duplicated in the use case.
    const session = RefreshSession.create({
      id: snapshot.id,
      userId: snapshot.userId,
      deviceId: snapshot.deviceId,
      tokenHash: snapshot.tokenHash,
      expiresAt: snapshot.expiresAt,
      revokedAt: snapshot.revokedAt,
    });

    // Reject the token when its backing session is no longer active for
    // the claimed user.
    if (
      !session.canAuthorizeAccessToken({
        userId: claims.userId,
        now: new Date(),
      })
    ) {
      throw new InvalidAccessTokenError();
    }

    return claims;
  }
}

/**
 * Signals that the submitted access token is invalid.
 */
export class InvalidAccessTokenError extends Error {
  /**
   * Creates a stable access-token error message suitable for client-facing
   * authentication failures.
   */
  constructor() {
    super('Invalid access token');
  }
}
