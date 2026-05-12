import type {
  RefreshSessionReadModel,
  RefreshSessionReader,
} from '../ports/sessions/refresh-session-reader.port';
import type {
  TokenClaims,
  TokenVerifier,
} from '../ports/tokens/token-verifier.port';
import {
  InvalidAccessTokenError,
  ValidateAccessTokenUseCase,
} from './validate-access-token.use-case';

describe('ValidateAccessTokenUseCase', () => {
  const accessToken = 'access-token';
  const claims: TokenClaims = {
    userId: 'user-id',
    sessionId: 'session-id',
  };

  const createSessionSnapshot = (
    overrides: Partial<RefreshSessionReadModel> = {},
  ): RefreshSessionReadModel => ({
    id: claims.sessionId,
    userId: claims.userId,
    deviceId: 'device-id',
    tokenHash: 'refresh-token-hash',
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    ...overrides,
  });

  const createUseCase = () => {
    const tokenVerifier = {
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    } satisfies jest.Mocked<TokenVerifier>;
    const refreshSessionReader = {
      findById: jest.fn(),
    } satisfies jest.Mocked<RefreshSessionReader>;

    const useCase = new ValidateAccessTokenUseCase(
      tokenVerifier,
      refreshSessionReader,
    );

    return {
      refreshSessionReader,
      tokenVerifier,
      useCase,
    };
  };

  it('given a valid access token when validating then it returns the token claims', async () => {
    const { tokenVerifier, refreshSessionReader, useCase } = createUseCase();

    tokenVerifier.verifyAccessToken.mockResolvedValue(claims);
    refreshSessionReader.findById.mockResolvedValue(createSessionSnapshot());

    await expect(useCase.execute(accessToken)).resolves.toEqual(claims);

    expect(tokenVerifier.verifyAccessToken).toHaveBeenCalledWith(accessToken);
    expect(refreshSessionReader.findById).toHaveBeenCalledWith(
      claims.sessionId,
    );
  });

  it('given an invalid access token when validating then it throws a stable access-token error', async () => {
    const { tokenVerifier, refreshSessionReader, useCase } = createUseCase();

    tokenVerifier.verifyAccessToken.mockResolvedValue(null);

    await expect(useCase.execute('invalid-access-token')).rejects.toThrow(
      InvalidAccessTokenError,
    );

    expect(refreshSessionReader.findById).not.toHaveBeenCalled();
  });

  it('given a token whose session is missing when validating then it throws a stable access-token error', async () => {
    const { tokenVerifier, refreshSessionReader, useCase } = createUseCase();

    tokenVerifier.verifyAccessToken.mockResolvedValue(claims);
    refreshSessionReader.findById.mockResolvedValue(null);

    await expect(useCase.execute(accessToken)).rejects.toThrow(
      InvalidAccessTokenError,
    );
  });

  it('given a token whose session is revoked when validating then it throws a stable access-token error', async () => {
    const { tokenVerifier, refreshSessionReader, useCase } = createUseCase();

    tokenVerifier.verifyAccessToken.mockResolvedValue(claims);
    refreshSessionReader.findById.mockResolvedValue(
      createSessionSnapshot({
        revokedAt: new Date(),
      }),
    );

    await expect(useCase.execute(accessToken)).rejects.toThrow(
      InvalidAccessTokenError,
    );
  });

  it('given a token whose session is expired when validating then it throws a stable access-token error', async () => {
    const { tokenVerifier, refreshSessionReader, useCase } = createUseCase();

    tokenVerifier.verifyAccessToken.mockResolvedValue(claims);
    refreshSessionReader.findById.mockResolvedValue(
      createSessionSnapshot({
        expiresAt: new Date(Date.now() - 60_000),
      }),
    );

    await expect(useCase.execute(accessToken)).rejects.toThrow(
      InvalidAccessTokenError,
    );
  });

  it('given a token whose session belongs to another user when validating then it throws a stable access-token error', async () => {
    const { tokenVerifier, refreshSessionReader, useCase } = createUseCase();

    tokenVerifier.verifyAccessToken.mockResolvedValue(claims);
    refreshSessionReader.findById.mockResolvedValue(
      createSessionSnapshot({
        userId: 'another-user-id',
      }),
    );

    await expect(useCase.execute(accessToken)).rejects.toThrow(
      InvalidAccessTokenError,
    );
  });
});
