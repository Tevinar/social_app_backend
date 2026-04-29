import type {
  TokenClaims,
  TokenVerifier,
} from '../ports/tokens/token-verifier';
import {
  InvalidAccessTokenError,
  ValidateAccessTokenUseCase,
} from './validate-access-token';

describe('ValidateAccessTokenUseCase', () => {
  const createUseCase = () => {
    const tokenVerifier = {
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    } satisfies jest.Mocked<TokenVerifier>;

    const useCase = new ValidateAccessTokenUseCase(tokenVerifier);

    return {
      tokenVerifier,
      useCase,
    };
  };

  it('given a valid access token when validating then it returns the token claims', async () => {
    const { tokenVerifier, useCase } = createUseCase();
    const claims: TokenClaims = {
      userId: 'user-id',
      sessionId: 'session-id',
    };

    tokenVerifier.verifyAccessToken.mockResolvedValue(claims);

    await expect(useCase.execute('access-token')).resolves.toEqual(claims);

    expect(tokenVerifier.verifyAccessToken).toHaveBeenCalledWith(
      'access-token',
    );
  });

  it('given an invalid access token when validating then it throws a stable access-token error', async () => {
    const { tokenVerifier, useCase } = createUseCase();

    tokenVerifier.verifyAccessToken.mockResolvedValue(null);

    await expect(useCase.execute('invalid-access-token')).rejects.toThrow(
      InvalidAccessTokenError,
    );
  });
});
