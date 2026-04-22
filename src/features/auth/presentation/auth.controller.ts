import {
  Body,
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
} from '../application/use-cases/sign-in-with-email-password';
import { SignInRequest } from './dto/sign-in-request';
import { SignInResponse } from './dto/sign-in-response';

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
   * Receives the sign-in use case used by the controller action.
   *
   * @param signInWithEmailPassword Auth application service for email/password sign-in.
   */
  constructor(
    private readonly signInWithEmailPassword: SignInWithEmailPasswordUseCase,
  ) {}

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
      });

      return SignInResponse.fromAuthSession(session);
    } catch (error: unknown) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException(error.message);
      }

      throw error;
    }
  }
}
