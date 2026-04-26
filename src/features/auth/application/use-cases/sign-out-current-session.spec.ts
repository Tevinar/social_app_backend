import type { RefreshSessionReader } from '../ports/sessions/refresh-session-reader';
import type { RefreshSessionRevoker } from '../ports/sessions/refresh-session-revoker';
import type { TokenHasher } from '../ports/tokens/token-hasher';
import type {
  TokenClaims,
  TokenVerifier,
} from '../ports/tokens/token-verifier';
import { SignOutCurrentSessionUseCase } from './sign-out-current-session';

describe('SignOutCurrentSessionUseCase', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const activeSessionExpiresAt = new Date('2026-01-02T00:00:00.000Z');
  const deviceId = '123e4567-e89b-42d3-a456-426614174000';
  const claims: TokenClaims = {
    userId: 'user-id',
    sessionId: 'session-id',
  };

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
    const refreshSessionRevoker = {
      revoke: jest.fn(),
    } satisfies jest.Mocked<RefreshSessionRevoker>;

    const useCase = new SignOutCurrentSessionUseCase(
      tokenVerifier,
      refreshSessionReader,
      tokenHasher,
      refreshSessionRevoker,
    );

    return {
      refreshSessionReader,
      refreshSessionRevoker,
      tokenHasher,
      tokenVerifier,
      useCase,
    };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('given a valid refresh token and active session when signing out then it revokes the session', async () => {
    const {
      refreshSessionReader,
      refreshSessionRevoker,
      tokenHasher,
      tokenVerifier,
      useCase,
    } = createUseCase();

    tokenVerifier.verifyRefreshToken.mockResolvedValue(claims);
    refreshSessionReader.findById.mockResolvedValue({
      id: 'session-id',
      userId: 'user-id',
      deviceId,
      tokenHash: 'refresh-token-hash',
      expiresAt: activeSessionExpiresAt,
      revokedAt: null,
    });
    tokenHasher.hash.mockResolvedValue('refresh-token-hash');
    refreshSessionRevoker.revoke.mockResolvedValue(undefined);

    await expect(
      useCase.execute({
        refreshToken: 'refresh-token',
        deviceId: ` ${deviceId.toUpperCase()} `,
      }),
    ).resolves.toBeUndefined();

    expect(tokenVerifier.verifyRefreshToken).toHaveBeenCalledWith(
      'refresh-token',
    );
    expect(refreshSessionReader.findById).toHaveBeenCalledWith('session-id');
    expect(tokenHasher.hash).toHaveBeenCalledWith('refresh-token');
    expect(refreshSessionRevoker.revoke).toHaveBeenCalledWith({
      id: 'session-id',
      revokedAt: now,
    });
  });

  it('given an invalid refresh token when signing out then it resolves without revoking', async () => {
    const {
      refreshSessionReader,
      refreshSessionRevoker,
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
    ).resolves.toBeUndefined();

    expect(refreshSessionReader.findById).not.toHaveBeenCalled();
    expect(tokenHasher.hash).not.toHaveBeenCalled();
    expect(refreshSessionRevoker.revoke).not.toHaveBeenCalled();
  });

  it('given a missing refresh session when signing out then it resolves without hashing the token', async () => {
    const {
      refreshSessionReader,
      refreshSessionRevoker,
      tokenHasher,
      tokenVerifier,
      useCase,
    } = createUseCase();

    tokenVerifier.verifyRefreshToken.mockResolvedValue(claims);
    refreshSessionReader.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        refreshToken: 'refresh-token',
        deviceId,
      }),
    ).resolves.toBeUndefined();

    expect(tokenHasher.hash).not.toHaveBeenCalled();
    expect(refreshSessionRevoker.revoke).not.toHaveBeenCalled();
  });

  it('given a mismatched session when signing out then it resolves without revoking', async () => {
    const {
      refreshSessionReader,
      refreshSessionRevoker,
      tokenHasher,
      tokenVerifier,
      useCase,
    } = createUseCase();

    tokenVerifier.verifyRefreshToken.mockResolvedValue(claims);
    refreshSessionReader.findById.mockResolvedValue({
      id: 'session-id',
      userId: 'user-id',
      deviceId: 'other-device-id',
      tokenHash: 'refresh-token-hash',
      expiresAt: activeSessionExpiresAt,
      revokedAt: null,
    });
    tokenHasher.hash.mockResolvedValue('refresh-token-hash');

    await expect(
      useCase.execute({
        refreshToken: 'refresh-token',
        deviceId,
      }),
    ).resolves.toBeUndefined();

    expect(refreshSessionRevoker.revoke).not.toHaveBeenCalled();
  });
});
