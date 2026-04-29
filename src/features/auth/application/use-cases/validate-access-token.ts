import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import {
  TOKEN_VERIFIER,
  type TokenClaims,
  type TokenVerifier,
} from '../ports/tokens/token-verifier';

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

/**
 * Application use case responsible for validating a submitted access token.
 *
 * Responsibilities:
 * - verify the submitted access token signature and claims
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
   */
  constructor(
    @Inject(TOKEN_VERIFIER)
    private readonly tokenVerifier: TokenVerifier,
  ) {}

  /**
   * Validates an access token and returns its authenticated identity claims.
   *
   * @param accessToken Raw access token submitted by the caller.
   * @returns Validated user and session identifiers extracted from the token.
   * @throws {InvalidAccessTokenError} Thrown when the access token is invalid.
   */
  async execute(accessToken: string): Promise<TokenClaims> {
    const claims = await this.tokenVerifier.verifyAccessToken(accessToken);

    if (!claims) {
      throw new InvalidAccessTokenError();
    }

    return claims;
  }
}
