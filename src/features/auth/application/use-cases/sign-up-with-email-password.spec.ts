jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(),
}));

import { randomUUID } from 'node:crypto';
import type { PasswordHasher } from '../ports/credentials/password-hasher';
import {
  CreateAuthRegistrationResult,
  type AuthRegistrationCreator,
} from '../ports/identity/auth-registration-creator';
import type { TokenCreator } from '../ports/tokens/token-creator';
import type { TokenHasher } from '../ports/tokens/token-hasher';
import {
  EmailAlreadyInUseError,
  SignUpWithEmailPasswordUseCase,
} from './sign-up-with-email-password';

describe('SignUpWithEmailPasswordUseCase', () => {
  const accessTokenExpiresAt = new Date('2026-01-01T00:15:00.000Z');
  const refreshTokenExpiresAt = new Date('2026-02-01T00:00:00.000Z');
  const userId = '00000000-0000-4000-8000-000000000001';
  const sessionId = '00000000-0000-4000-8000-000000000002';
  const deviceId = '123e4567-e89b-42d3-a456-426614174000';
  const randomUUIDMock = randomUUID as jest.MockedFunction<typeof randomUUID>;

  const createUseCase = () => {
    const authRegistrationWriter = {
      create: jest.fn(),
    } satisfies jest.Mocked<AuthRegistrationCreator>;
    const passwordHasher = {
      hash: jest.fn(),
    } satisfies jest.Mocked<PasswordHasher>;
    const tokenCreator = {
      createAccessToken: jest.fn(),
      createRefreshToken: jest.fn(),
    } satisfies jest.Mocked<TokenCreator>;
    const tokenHasher = {
      hash: jest.fn(),
    } satisfies jest.Mocked<TokenHasher>;

    const useCase = new SignUpWithEmailPasswordUseCase(
      authRegistrationWriter,
      passwordHasher,
      tokenCreator,
      tokenHasher,
    );

    return {
      authRegistrationWriter,
      passwordHasher,
      tokenCreator,
      tokenHasher,
      useCase,
    };
  };

  beforeEach(() => {
    randomUUIDMock.mockReset();
    randomUUIDMock.mockReturnValueOnce(userId).mockReturnValueOnce(sessionId);
  });

  it('given valid registration data when signing up then it creates the user and returns an authenticated session', async () => {
    const {
      authRegistrationWriter,
      passwordHasher,
      tokenCreator,
      tokenHasher,
      useCase,
    } = createUseCase();

    passwordHasher.hash.mockResolvedValue('password-hash');
    tokenCreator.createAccessToken.mockResolvedValue({
      token: 'access-token',
      expiresAt: accessTokenExpiresAt,
    });
    tokenCreator.createRefreshToken.mockResolvedValue({
      token: 'refresh-token',
      expiresAt: refreshTokenExpiresAt,
    });
    tokenHasher.hash.mockResolvedValue('refresh-token-hash');
    authRegistrationWriter.create.mockResolvedValue(
      CreateAuthRegistrationResult.CREATED,
    );

    await expect(
      useCase.execute({
        email: '  USER@Example.COM ',
        password: '  Secret1  ',
        name: '  Ada Lovelace  ',
        deviceId: ` ${deviceId.toUpperCase()} `,
      }),
    ).resolves.toEqual({
      user: {
        id: userId,
        email: 'user@example.com',
        name: 'Ada Lovelace',
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('  Secret1  ');
    expect(tokenCreator.createAccessToken).toHaveBeenCalledWith({
      userId,
      sessionId,
    });
    expect(tokenCreator.createRefreshToken).toHaveBeenCalledWith({
      userId,
      sessionId,
    });
    expect(tokenHasher.hash).toHaveBeenCalledWith('refresh-token');
    expect(authRegistrationWriter.create).toHaveBeenCalledWith({
      user: {
        id: userId,
        email: 'user@example.com',
        passwordHash: 'password-hash',
        name: 'Ada Lovelace',
      },
      refreshSession: {
        id: sessionId,
        userId,
        deviceId,
        tokenHash: 'refresh-token-hash',
        expiresAt: refreshTokenExpiresAt,
      },
    });
  });

  it('given an email conflict when signing up then it throws a stable registration error', async () => {
    const {
      authRegistrationWriter,
      passwordHasher,
      tokenCreator,
      tokenHasher,
      useCase,
    } = createUseCase();

    passwordHasher.hash.mockResolvedValue('password-hash');
    tokenCreator.createAccessToken.mockResolvedValue({
      token: 'access-token',
      expiresAt: accessTokenExpiresAt,
    });
    tokenCreator.createRefreshToken.mockResolvedValue({
      token: 'refresh-token',
      expiresAt: refreshTokenExpiresAt,
    });
    tokenHasher.hash.mockResolvedValue('refresh-token-hash');
    authRegistrationWriter.create.mockResolvedValue(
      CreateAuthRegistrationResult.EMAIL_CONFLICT,
    );

    await expect(
      useCase.execute({
        email: 'user@example.com',
        password: 'Secret1',
        name: 'Ada Lovelace',
        deviceId,
      }),
    ).rejects.toThrow(EmailAlreadyInUseError);
  });
});
