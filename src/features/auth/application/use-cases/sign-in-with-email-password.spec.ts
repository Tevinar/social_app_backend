jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(),
}));

import { randomUUID } from 'node:crypto';
import type { PasswordVerifier } from '../ports/credentials/password-verifier';
import type {
  AuthUser,
  AuthUserReader,
} from '../ports/identity/auth-user-reader';
import {
  CreateRefreshSessionResult,
  type RefreshSessionCreator,
} from '../ports/sessions/refresh-session-creator';
import type { TokenCreator } from '../ports/tokens/token-creator';
import type { TokenHasher } from '../ports/tokens/token-hasher';
import {
  InvalidCredentialsError,
  SignInWithEmailPasswordUseCase,
  UserAlreadySignedInOnDeviceError,
} from './sign-in-with-email-password';

describe('SignInWithEmailPasswordUseCase', () => {
  const accessTokenExpiresAt = new Date('2026-01-01T00:15:00.000Z');
  const refreshTokenExpiresAt = new Date('2026-02-01T00:00:00.000Z');
  const sessionId = '00000000-0000-4000-8000-000000000002';
  const deviceId = '123e4567-e89b-42d3-a456-426614174000';
  const randomUUIDMock = randomUUID as jest.MockedFunction<typeof randomUUID>;

  const authUser: AuthUser = {
    id: 'user-id',
    email: 'user@example.com',
    passwordHash: 'stored-password-hash',
    name: 'Ada Lovelace',
    emailVerifiedAt: null,
  };

  const createUseCase = () => {
    const authUserReader = {
      findByEmail: jest.fn(),
    } satisfies jest.Mocked<AuthUserReader>;
    const passwordVerifier = {
      verify: jest.fn(),
    } satisfies jest.Mocked<PasswordVerifier>;
    const refreshSessionWriter = {
      create: jest.fn(),
    } satisfies jest.Mocked<RefreshSessionCreator>;
    const tokenCreator = {
      createAccessToken: jest.fn(),
      createRefreshToken: jest.fn(),
    } satisfies jest.Mocked<TokenCreator>;
    const tokenHasher = {
      hash: jest.fn(),
    } satisfies jest.Mocked<TokenHasher>;

    const useCase = new SignInWithEmailPasswordUseCase(
      authUserReader,
      passwordVerifier,
      refreshSessionWriter,
      tokenCreator,
      tokenHasher,
    );

    return {
      authUserReader,
      passwordVerifier,
      refreshSessionWriter,
      tokenCreator,
      tokenHasher,
      useCase,
    };
  };

  beforeEach(() => {
    randomUUIDMock.mockReset();
    randomUUIDMock.mockReturnValue(sessionId);
  });

  it('given valid credentials when signing in then it creates a session and returns tokens', async () => {
    const {
      authUserReader,
      passwordVerifier,
      refreshSessionWriter,
      tokenCreator,
      tokenHasher,
      useCase,
    } = createUseCase();

    authUserReader.findByEmail.mockResolvedValue(authUser);
    passwordVerifier.verify.mockResolvedValue(true);
    tokenCreator.createAccessToken.mockResolvedValue({
      token: 'access-token',
      expiresAt: accessTokenExpiresAt,
    });
    tokenCreator.createRefreshToken.mockResolvedValue({
      token: 'refresh-token',
      expiresAt: refreshTokenExpiresAt,
    });
    tokenHasher.hash.mockResolvedValue('refresh-token-hash');
    refreshSessionWriter.create.mockResolvedValue(
      CreateRefreshSessionResult.CREATED,
    );

    await expect(
      useCase.execute({
        email: '  USER@Example.COM ',
        password: '  Secret1  ',
        deviceId: ` ${deviceId.toUpperCase()} `,
      }),
    ).resolves.toEqual({
      user: {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Ada Lovelace',
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    });

    expect(authUserReader.findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(passwordVerifier.verify).toHaveBeenCalledWith(
      '  Secret1  ',
      'stored-password-hash',
    );
    expect(tokenCreator.createAccessToken).toHaveBeenCalledWith({
      userId: 'user-id',
      sessionId,
    });
    expect(tokenCreator.createRefreshToken).toHaveBeenCalledWith({
      userId: 'user-id',
      sessionId,
    });
    expect(tokenHasher.hash).toHaveBeenCalledWith('refresh-token');
    expect(refreshSessionWriter.create).toHaveBeenCalledWith({
      id: sessionId,
      userId: 'user-id',
      deviceId,
      tokenHash: 'refresh-token-hash',
      expiresAt: refreshTokenExpiresAt,
    });
  });

  it('given an unknown email when signing in then it throws invalid credentials without verifying a password', async () => {
    const {
      authUserReader,
      passwordVerifier,
      refreshSessionWriter,
      tokenCreator,
      tokenHasher,
      useCase,
    } = createUseCase();

    authUserReader.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'missing@example.com',
        password: 'Secret1',
        deviceId,
      }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(passwordVerifier.verify).not.toHaveBeenCalled();
    expect(tokenCreator.createAccessToken).not.toHaveBeenCalled();
    expect(tokenCreator.createRefreshToken).not.toHaveBeenCalled();
    expect(tokenHasher.hash).not.toHaveBeenCalled();
    expect(refreshSessionWriter.create).not.toHaveBeenCalled();
  });

  it('given a password mismatch when signing in then it throws invalid credentials without issuing tokens', async () => {
    const {
      authUserReader,
      passwordVerifier,
      refreshSessionWriter,
      tokenCreator,
      tokenHasher,
      useCase,
    } = createUseCase();

    authUserReader.findByEmail.mockResolvedValue(authUser);
    passwordVerifier.verify.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: 'user@example.com',
        password: 'wrong-password',
        deviceId,
      }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(tokenCreator.createAccessToken).not.toHaveBeenCalled();
    expect(tokenCreator.createRefreshToken).not.toHaveBeenCalled();
    expect(tokenHasher.hash).not.toHaveBeenCalled();
    expect(refreshSessionWriter.create).not.toHaveBeenCalled();
  });

  it('given an active session conflict when signing in then it throws a stable session error', async () => {
    const {
      authUserReader,
      passwordVerifier,
      refreshSessionWriter,
      tokenCreator,
      tokenHasher,
      useCase,
    } = createUseCase();

    authUserReader.findByEmail.mockResolvedValue(authUser);
    passwordVerifier.verify.mockResolvedValue(true);
    tokenCreator.createAccessToken.mockResolvedValue({
      token: 'access-token',
      expiresAt: accessTokenExpiresAt,
    });
    tokenCreator.createRefreshToken.mockResolvedValue({
      token: 'refresh-token',
      expiresAt: refreshTokenExpiresAt,
    });
    tokenHasher.hash.mockResolvedValue('refresh-token-hash');
    refreshSessionWriter.create.mockResolvedValue(
      CreateRefreshSessionResult.ACTIVE_SESSION_CONFLICT,
    );

    await expect(
      useCase.execute({
        email: 'user@example.com',
        password: 'Secret1',
        deviceId,
      }),
    ).rejects.toThrow(UserAlreadySignedInOnDeviceError);
  });
});
