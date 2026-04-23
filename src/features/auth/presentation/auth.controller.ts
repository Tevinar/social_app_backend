import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  InvalidCredentialsError,
  SignInWithEmailPasswordUseCase,
  UserAlreadySignedInOnDeviceError,
} from '../application/use-cases/sign-in-with-email-password';
import {
  InvalidRefreshTokenError,
  RefreshSessionUseCase,
} from '../application/use-cases/refresh-session';
import { SignOutCurrentSessionUseCase } from '../application/use-cases/sign-out-current-session';
import {
  EmailAlreadyInUseError,
  SignUpWithEmailPasswordUseCase,
} from '../application/use-cases/sign-up-with-email-password';
import { RefreshSessionRequest } from './dto/refresh-session-request';
import { RefreshSessionResponse } from './dto/refresh-session-response';
import { SignInRequest } from './dto/sign-in-request';
import { SignInResponse } from './dto/sign-in-response';
import { SignOutCurrentSessionRequest } from './dto/sign-out-current-session-request';
import { SignUpRequest } from './dto/sign-up-request';
import { SignUpResponse } from './dto/sign-up-response';

/**
 * HTTP controller exposing authentication endpoints.
 *
 * This presentation adapter is responsible for request validation, translating
 * application errors into HTTP semantics, and mapping use-case results into
 * response DTOs.
 */
@Controller('auth')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
export class AuthController {
  /**
   * Receives the auth use cases used by the controller actions.
   *
   * @param signUpWithEmailPassword Auth application service for email/password sign-up.
   * @param signInWithEmailPassword Auth application service for email/password sign-in.
   * @param refreshSession Auth application service for refresh-token renewal.
   * @param signOutCurrentSession Auth application service for current-session sign-out.
   */
  constructor(
    private readonly signUpWithEmailPassword: SignUpWithEmailPasswordUseCase,
    private readonly signInWithEmailPassword: SignInWithEmailPasswordUseCase,
    private readonly refreshSession: RefreshSessionUseCase,
    private readonly signOutCurrentSession: SignOutCurrentSessionUseCase,
  ) {}

  /**
   * Registers a user from an email/password pair and opens the initial session.
   *
   * The endpoint returns the created user data together with the issued auth
   * tokens so the client can start authenticated immediately after sign-up.
   *
   * @param body Validated sign-up request body.
   * @returns HTTP response DTO containing the created auth session data.
   * @throws {ConflictException} Thrown when the submitted email is already in use.
   */
  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() body: SignUpRequest): Promise<SignUpResponse> {
    try {
      const session = await this.signUpWithEmailPassword.execute({
        email: body.email,
        password: body.password,
        name: body.name,
        deviceId: body.deviceId,
      });

      return SignUpResponse.fromSignUpResult(session);
    } catch (error: unknown) {
      if (error instanceof EmailAlreadyInUseError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  /**
   * Authenticates a user from an email/password pair.
   *
   * The endpoint returns both issued tokens and the public user data needed by
   * the client to initialize an authenticated session.
   *
   * @param body Validated sign-in request body.
   * @returns HTTP response DTO containing the issued auth session data.
   * @throws {UnauthorizedException} Thrown when the submitted credentials are invalid.
   */
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() body: SignInRequest): Promise<SignInResponse> {
    try {
      const session = await this.signInWithEmailPassword.execute({
        email: body.email,
        password: body.password,
        deviceId: body.deviceId,
      });

      return SignInResponse.fromAuthSession(session);
    } catch (error: unknown) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException(error.message);
      }

      if (error instanceof UserAlreadySignedInOnDeviceError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }

  /**
   * Renews an authenticated session from a valid refresh token.
   *
   * The endpoint rotates the submitted refresh token and returns a fresh token
   * pair bound to the same device session.
   *
   * @param body Validated refresh-session request body.
   * @returns HTTP response DTO containing the rotated token pair.
   * @throws {UnauthorizedException} Thrown when the submitted refresh token is invalid.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: RefreshSessionRequest,
  ): Promise<RefreshSessionResponse> {
    try {
      const result = await this.refreshSession.execute({
        refreshToken: body.refreshToken,
        deviceId: body.deviceId,
      });

      return RefreshSessionResponse.fromRefreshSessionResult(result);
    } catch (error: unknown) {
      if (error instanceof InvalidRefreshTokenError) {
        throw new UnauthorizedException(error.message);
      }

      throw error;
    }
  }

  /**
   * Revokes the caller's current refresh session.
   *
   * The endpoint is intentionally idempotent: invalid or already-expired
   * session data still resolves to a successful sign-out response so the client
   * can always clear local auth state.
   *
   * @param body Validated sign-out request body.
   */
  @Post('sign-out')
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(@Body() body: SignOutCurrentSessionRequest): Promise<void> {
    await this.signOutCurrentSession.execute({
      refreshToken: body.refreshToken,
      deviceId: body.deviceId,
    });
  }
}
