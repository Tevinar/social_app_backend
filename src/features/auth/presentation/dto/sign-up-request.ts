import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * HTTP request body accepted by the sign-up endpoint.
 */
export class SignUpRequest {
  /**
   * Email address submitted by the caller.
   */
  @IsEmail()
  email!: string;

  /**
   * Plaintext password submitted by the caller.
   */
  @IsString()
  @MinLength(6)
  password!: string;

  /**
   * Public profile name submitted during registration.
   */
  @IsString()
  @MinLength(1)
  name!: string;
}
