import { Inject, Injectable } from '@nestjs/common';
import {
  AUTH_USER_READER,
  type AuthUserReader,
} from '../ports/identity/auth-user-reader.port';
import { randomUUID } from 'node:crypto';
import { UseCase } from '../../../../core/contracts/use-case';
import { Email } from '../../domain/value-objects/email';
import { DeviceId } from '../../domain/value-objects/device-id';
import {
  PASSWORD_VERIFIER,
  type PasswordVerifier,
} from '../ports/credentials/password-verifier.port';
import {
  REFRESH_SESSION_CREATOR,
  type RefreshSessionCreator,
} from '../ports/sessions/refresh-session-creator.port';
import {
  TOKEN_CREATOR,
  type TokenCreator,
} from '../ports/tokens/token-creator.port';
import {
  TOKEN_HASHER,
  type TokenHasher,
} from '../ports/tokens/token-hasher.port';
import { Auth } from '../../domain/entities/auth';
import { AuthUser } from '../../domain/entities/auth-user';

/**
 * Signals that the provided email/password pair does not match a valid user.
 *
 * The use case throws this error for both "user not found" and "wrong
 * password" paths so callers do not leak which part of the credentials failed.
 */
export class InvalidCredentialsError extends Error {
  /**
   * Creates a stable authentication error message suitable for client-facing
   * credential failures.
   */
  constructor() {
    super('Invalid email or password');
  }
}

/**
 * Application use case responsible for authenticating a user with an email and
 * password and opening a new refresh session.
 *
 * Responsibilities:
 * - normalize the incoming email
 * - normalize and validate the client device identifier
 * - load the user record needed for password verification
 * - validate the submitted password
 * - rotate any active session that already exists for the same user/device pair
 * - create access and refresh tokens
 * - persist the hashed refresh token for future rotation/revocation
 *
 * This class orchestrates the sign-in flow through application ports and does
 * not depend on HTTP, database, hashing, or JWT implementation details.
 */
@Injectable()
export class SignInWithEmailPasswordUseCase implements UseCase<
  SignInWithEmailPasswordParams,
  Auth
> {
  /**
   * Receives the feature ports required to authenticate a user and create a
   * server-managed session.
   *
   * @param authUserReader Loads users by email from the infrastructure layer.
   * @param passwordVerifier Verifies a plaintext password against a stored hash.
   * @param refreshSessionWriter Persists refresh session records for later
   * revocation and renewal.
   * @param tokenCreator Creates access and refresh tokens for authenticated users.
   * @param tokenHasher Hashes refresh tokens before they are stored.
   */
  constructor(
    @Inject(AUTH_USER_READER)
    private readonly authUserReader: AuthUserReader,
    @Inject(PASSWORD_VERIFIER)
    private readonly passwordVerifier: PasswordVerifier,
    @Inject(REFRESH_SESSION_CREATOR)
    private readonly refreshSessionWriter: RefreshSessionCreator,
    @Inject(TOKEN_CREATOR)
    private readonly tokenCreator: TokenCreator,
    @Inject(TOKEN_HASHER)
    private readonly tokenHasher: TokenHasher,
  ) {}

  /**
   * Authenticates a user from email/password credentials and returns the newly
   * issued session payload.
   *
   * The email is normalized before lookup so the authentication flow is not
   * sensitive to surrounding whitespace or casing differences.
   *
   * @param params Credentials submitted by the caller.
   * @returns The authenticated user data together with the issued access and
   * refresh tokens.
   * @throws {InvalidCredentialsError} Thrown when the user does not exist or
   * the password check fails.
   */
  async execute(params: SignInWithEmailPasswordParams): Promise<Auth> {
    const email = Email.from(params.email);
    const deviceId = DeviceId.from(params.deviceId);

    const user = await this.authUserReader.findByEmail(email.value);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordVerifier.verify(
      params.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const sessionId = randomUUID();

    const access = await this.tokenCreator.createAccessToken({
      userId: user.id,
      sessionId,
    });

    const refresh = await this.tokenCreator.createRefreshToken({
      userId: user.id,
      sessionId,
    });

    const refreshTokenHash = await this.tokenHasher.hash(refresh.token);

    await this.refreshSessionWriter.create({
      id: sessionId,
      userId: user.id,
      deviceId: deviceId.value,
      tokenHash: refreshTokenHash,
      expiresAt: refresh.expiresAt,
    });

    return Auth.create({
      user: AuthUser.create({
        id: user.id,
        email: user.email,
        name: user.name,
      }),
      accessToken: access.token,
      refreshToken: refresh.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshTokenExpiresAt: refresh.expiresAt,
    });
  }
}

export type SignInWithEmailPasswordParams = {
  email: string;
  password: string;
  deviceId: string;
};
