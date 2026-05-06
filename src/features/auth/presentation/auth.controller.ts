import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SignInWithEmailPasswordUseCase } from '../application/use-cases/sign-in-with-email-password.use-case';
import { RefreshSessionUseCase } from '../application/use-cases/refresh-session.use-case';
import { SignOutCurrentSessionUseCase } from '../application/use-cases/sign-out-current-session.use-case';
import { SignUpWithEmailPasswordUseCase } from '../application/use-cases/sign-up-with-email-password.use-case';
import { RefreshSessionRequest } from './dto/requests/refresh-session.request';
import { SignInRequest } from './dto/requests/sign-in.request';
import { SignOutCurrentSessionRequest } from './dto/requests/sign-out-current-session.request';
import { SignUpRequest } from './dto/requests/sign-up.request';
import { AuthResponse } from './dto/responses/auth.response';
import { RefreshSessionResponse } from './dto/responses/refresh-session.response';

/**
 * HTTP controller exposing authentication endpoints.
 *
 * This presentation adapter is responsible for request validation and mapping
 * use-case results into response DTOs. Application errors are translated by
 * the global HTTP exception filter.
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
   */
  @Post('sign-up')
  async signUp(@Body() body: SignUpRequest): Promise<AuthResponse> {
    const session = await this.signUpWithEmailPassword.execute({
      email: body.email,
      password: body.password,
      name: body.name,
      deviceId: body.deviceId,
    });

    return AuthResponse.fromAuth(session);
  }

  /**
   * Authenticates a user from an email/password pair.
   *
   * The endpoint returns both issued tokens and the public user data needed by
   * the client to initialize an authenticated session.
   *
   * @param body Validated sign-in request body.
   * @returns HTTP response DTO containing the issued auth session data.
   */
  @Post('sign-in')
  async signIn(@Body() body: SignInRequest): Promise<AuthResponse> {
    const session = await this.signInWithEmailPassword.execute({
      email: body.email,
      password: body.password,
      deviceId: body.deviceId,
    });

    return AuthResponse.fromAuth(session);
  }

  /**
   * Renews an authenticated session from a valid refresh token.
   *
   * The endpoint rotates the submitted refresh token and returns a fresh token
   * pair bound to the same device session.
   *
   * @param body Validated refresh-session request body.
   * @returns HTTP response DTO containing the rotated token pair.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: RefreshSessionRequest,
  ): Promise<RefreshSessionResponse> {
    const result = await this.refreshSession.execute({
      refreshToken: body.refreshToken,
      deviceId: body.deviceId,
    });

    return RefreshSessionResponse.fromRefreshSessionResult(result);
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
