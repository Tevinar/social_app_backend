import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

/**
 * HTTP request body accepted by the sign-in endpoint.
 */
export class SignInRequest {
  /**
   * Email address submitted by the caller.
   */
  @IsEmail()
  email!: string;

  /**
   * Plaintext password submitted by the caller.
   */
  @IsString()
  @MinLength(1)
  password!: string;

  /**
   * App-scoped client installation identifier.
   */
  @IsUUID(4)
  deviceId!: string;
}
