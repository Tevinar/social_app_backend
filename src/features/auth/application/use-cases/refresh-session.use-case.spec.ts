import { Logger } from '@nestjs/common';
import type { RefreshSessionReader } from '../ports/sessions/refresh-session-reader.port';
import type { RefreshSessionRotator } from '../ports/sessions/refresh-session-rotator.port';
import type { TokenCreator } from '../ports/tokens/token-creator.port';
import type { TokenHasher } from '../ports/tokens/token-hasher.port';
import type {
  TokenClaims,
  TokenVerifier,
} from '../ports/tokens/token-verifier.port';
import {
  InvalidRefreshTokenError,
  RefreshSessionUseCase,
} from './refresh-session.use-case';

describe('RefreshSessionUseCase', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const accessTokenExpiresAt = new Date('2026-01-01T00:15:00.000Z');
  const refreshTokenExpiresAt = new Date('2026-02-01T00:00:00.000Z');
  const activeSessionExpiresAt = new Date('2026-01-02T00:00:00.000Z');
  const deviceId = '123e4567-e89b-42d3-a456-426614174000';
  const claims: TokenClaims = {
    userId: 'user-id',
    sessionId: 'session-id',
  };
  // Suppresses expected Logger.warn output from invalid-token paths, then restores it after each test.
  let warnSpy: jest.SpyInstance;

  const createUseCase = () => {
    const tokenVerifier = {
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    } satisfies jest.Mocked<TokenVerifier>;
    const refreshSessionReader = {
      findById: jest.fn(),
    } satisfies jest.Mocked<RefreshSessionReader>;
    const tokenHasher = {
      hash: jest.fn(),
    } satisfies jest.Mocked<TokenHasher>;
    const tokenCreator = {
      createAccessToken: jest.fn(),
      createRefreshToken: jest.fn(),
    } satisfies jest.Mocked<TokenCreator>;
    const refreshSessionRotator = {
      rotate: jest.fn(),
    } satisfies jest.Mocked<RefreshSessionRotator>;

    const useCase = new RefreshSessionUseCase(
      tokenVerifier,
      refreshSessionReader,
      tokenHasher,
      tokenCreator,
      refreshSessionRotator,
    );

    return {
      refreshSessionReader,
      refreshSessionRotator,
      tokenCreator,
      tokenHasher,
      tokenVerifier,
      useCase,
    };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    warnSpy = jest
      // The use case creates its own private Logger, so spy on the shared prototype method.
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    jest.useRealTimers();
  });

  it('given a valid refresh token and active session when refreshing then it rotates the session and returns new tokens', async () => {
    const {
      refreshSessionReader,
      refreshSessionRotator,
      tokenCreator,
      tokenHasher,
      tokenVerifier,
      useCase,
    } = createUseCase();

    tokenVerifier.verifyRefreshToken.mockResolvedValue(claims);
    refreshSessionReader.findById.mockResolvedValue({
      id: 'session-id',
      userId: 'user-id',
      deviceId,
      tokenHash: 'old-refresh-token-hash',
      expiresAt: activeSessionExpiresAt,
      revokedAt: null,
    });
    tokenHasher.hash
      .mockResolvedValueOnce('old-refresh-token-hash')
      .mockResolvedValueOnce('new-refresh-token-hash');
    tokenCreator.createAccessToken.mockResolvedValue({
      token: 'new-access-token',
      expiresAt: accessTokenExpiresAt,
    });
    tokenCreator.createRefreshToken.mockResolvedValue({
      token: 'new-refresh-token',
      expiresAt: refreshTokenExpiresAt,
    });
    refreshSessionRotator.rotate.mockResolvedValue(undefined);

    await expect(
      useCase.execute({
        refreshToken: 'old-refresh-token',
        deviceId: ` ${deviceId.toUpperCase()} `,
      }),
    ).resolves.toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    });

    expect(tokenVerifier.verifyRefreshToken).toHaveBeenCalledWith(
      'old-refresh-token',
    );
    expect(refreshSessionReader.findById).toHaveBeenCalledWith('session-id');
    expect(tokenHasher.hash).toHaveBeenNthCalledWith(1, 'old-refresh-token');
    expect(tokenCreator.createAccessToken).toHaveBeenCalledWith({
      userId: 'user-id',
      sessionId: 'session-id',
    });
    expect(tokenCreator.createRefreshToken).toHaveBeenCalledWith({
      userId: 'user-id',
      sessionId: 'session-id',
    });
    expect(tokenHasher.hash).toHaveBeenNthCalledWith(2, 'new-refresh-token');
    expect(refreshSessionRotator.rotate).toHaveBeenCalledWith({
      id: 'session-id',
      tokenHash: 'new-refresh-token-hash',
      expiresAt: refreshTokenExpiresAt,
    });
  });

  it('given an invalid refresh token when refreshing then it throws without reading a session', async () => {
    const {
      refreshSessionReader,
      refreshSessionRotator,
      tokenCreator,
      tokenHasher,
      tokenVerifier,
      useCase,
    } = createUseCase();

    tokenVerifier.verifyRefreshToken.mockResolvedValue(null);

    await expect(
      useCase.execute({
        refreshToken: 'invalid-refresh-token',
        deviceId,
      }),
    ).rejects.toThrow(InvalidRefreshTokenError);

    expect(refreshSessionReader.findById).not.toHaveBeenCalled();
    expect(tokenHasher.hash).not.toHaveBeenCalled();
    expect(tokenCreator.createAccessToken).not.toHaveBeenCalled();
    expect(tokenCreator.createRefreshToken).not.toHaveBeenCalled();
    expect(refreshSessionRotator.rotate).not.toHaveBeenCalled();
  });

  it('given a missing refresh session when refreshing then it throws without hashing the token', async () => {
    const {
      refreshSessionReader,
      refreshSessionRotator,
      tokenCreator,
      tokenHasher,
      tokenVerifier,
      useCase,
    } = createUseCase();

    tokenVerifier.verifyRefreshToken.mockResolvedValue(claims);
    refreshSessionReader.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        refreshToken: 'old-refresh-token',
        deviceId,
      }),
    ).rejects.toThrow(InvalidRefreshTokenError);

    expect(tokenHasher.hash).not.toHaveBeenCalled();
    expect(tokenCreator.createAccessToken).not.toHaveBeenCalled();
    expect(tokenCreator.createRefreshToken).not.toHaveBeenCalled();
    expect(refreshSessionRotator.rotate).not.toHaveBeenCalled();
  });

  it('given a mismatched session when refreshing then it throws without rotating', async () => {
    const {
      refreshSessionReader,
      refreshSessionRotator,
      tokenCreator,
      tokenHasher,
      tokenVerifier,
      useCase,
    } = createUseCase();

    tokenVerifier.verifyRefreshToken.mockResolvedValue(claims);
    refreshSessionReader.findById.mockResolvedValue({
      id: 'session-id',
      userId: 'user-id',
      deviceId: 'other-device-id',
      tokenHash: 'old-refresh-token-hash',
      expiresAt: activeSessionExpiresAt,
      revokedAt: null,
    });
    tokenHasher.hash.mockResolvedValue('old-refresh-token-hash');

    await expect(
      useCase.execute({
        refreshToken: 'old-refresh-token',
        deviceId,
      }),
    ).rejects.toThrow(InvalidRefreshTokenError);

    expect(tokenCreator.createAccessToken).not.toHaveBeenCalled();
    expect(tokenCreator.createRefreshToken).not.toHaveBeenCalled();
    expect(refreshSessionRotator.rotate).not.toHaveBeenCalled();
  });
});
