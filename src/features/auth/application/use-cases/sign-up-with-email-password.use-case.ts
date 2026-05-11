import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UseCase } from '../../../../core/contracts/use-case';
import {
  TOKEN_CREATOR,
  type TokenCreator,
} from '../ports/tokens/token-creator.port';
import {
  TOKEN_HASHER,
  type TokenHasher,
} from '../ports/tokens/token-hasher.port';
import { DeviceId } from '../../domain/value-objects/device-id';
import { Email } from '../../domain/value-objects/email';
import { Name } from '../../domain/value-objects/name';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../ports/credentials/password-hasher.port';
import { NewPassword } from '../../domain/value-objects/new-password';
import {
  AUTH_REGISTRATION_CREATOR,
  CreateAuthRegistrationResult,
  type AuthRegistrationCreator,
} from '../ports/identity/auth-registration-creator.port';
import { Auth } from '../../domain/entities/auth';
import { AuthUser } from '../../domain/entities/auth-user';

/**
 * Signals that the submitted email address is already owned by another user.
 */
export class EmailAlreadyInUseError extends Error {
  /**
   * Creates a stable registration error message suitable for client-facing
   * uniqueness failures.
   */
  constructor() {
    super('Email already in use');
  }
}

/**
 * Application use case responsible for registering a user from email/password
 * credentials and opening an initial refresh session.
 *
 * Responsibilities:
 * - normalize the incoming email
 * - normalize and validate the client device identifier
 * - normalize and validate the submitted public profile name
 * - validate the submitted password against sign-up policy
 * - hash the submitted password before persistence
 * - create access and refresh tokens
 * - persist the user/profile records and refresh session atomically
 */
@Injectable()
export class SignUpWithEmailPasswordUseCase implements UseCase<
  SignUpWithEmailPasswordParams,
  Auth
> {
  /**
   * Receives the feature ports required to create a new auth user and
   * establish the initial authenticated session.
   *
   * @param authRegistrationWriter Persists the registration write set
   * atomically.
   * @param passwordHasher Hashes plaintext passwords before storage.
   * @param tokenCreator Creates access and refresh tokens for authenticated users.
   * @param tokenHasher Hashes refresh tokens before they are stored.
   */
  constructor(
    @Inject(AUTH_REGISTRATION_CREATOR)
    private readonly authRegistrationWriter: AuthRegistrationCreator,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_CREATOR)
    private readonly tokenCreator: TokenCreator,
    @Inject(TOKEN_HASHER)
    private readonly tokenHasher: TokenHasher,
  ) {}

  /**
   * Registers a new user from email/password credentials and returns the newly
   * issued authenticated session payload.
   *
   * All persistence writes are committed together through the
   * `AuthRegistrationWriter` so the use case never leaves behind a partially
   * created account when one write in the sign-up flow fails.
   *
   * @param params Registration data submitted by the caller.
   * @returns The created user data together with the issued access and refresh
   * tokens.
   * @throws {EmailAlreadyInUseError} Thrown when another user already owns the
   * provided email address.
   */
  async execute(params: SignUpWithEmailPasswordParams): Promise<Auth> {
    const email = Email.from(params.email);
    const deviceId = DeviceId.from(params.deviceId);
    const name = Name.from(params.name);
    const newPassword = NewPassword.from(params.password);
    const userId = randomUUID();
    const sessionId = randomUUID();
    const passwordHash = await this.passwordHasher.hash(newPassword.value);

    const access = await this.tokenCreator.createAccessToken({
      userId,
      sessionId,
    });

    const refresh = await this.tokenCreator.createRefreshToken({
      userId,
      sessionId,
    });

    const refreshTokenHash = await this.tokenHasher.hash(refresh.token);

    const result = await this.authRegistrationWriter.create({
      user: {
        id: userId,
        email: email.value,
        passwordHash,
        name: name.value,
      },
      refreshSession: {
        id: sessionId,
        userId,
        deviceId: deviceId.value,
        tokenHash: refreshTokenHash,
        expiresAt: refresh.expiresAt,
      },
    });

    if (result === CreateAuthRegistrationResult.EMAIL_CONFLICT) {
      throw new EmailAlreadyInUseError();
    }

    return Auth.create({
      user: AuthUser.create({
        id: userId,
        email: email.value,
        name: name.value,
      }),
      accessToken: access.token,
      refreshToken: refresh.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshTokenExpiresAt: refresh.expiresAt,
    });
  }
}

/**
 * Input required to register a user with email/password credentials.
 */
export type SignUpWithEmailPasswordParams = {
  email: string;
  password: string;
  name: string;
  deviceId: string;
};
