import { IsEmail, IsString, IsUUID, Matches, MinLength } from 'class-validator';
import { NEW_PASSWORD_MIN_LENGTH } from '../../domain/value-objects/new-password';
import { NAME_MIN_NON_BLANK_CHARACTERS_REGEX } from '../../domain/value-objects/name';

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
  @MinLength(NEW_PASSWORD_MIN_LENGTH)
  password!: string;

  /**
   * Public profile name submitted during registration.
   */
  @IsString()
  @Matches(NAME_MIN_NON_BLANK_CHARACTERS_REGEX)
  name!: string;

  /**
   * App-scoped client installation identifier.
   */
  @IsUUID(4)
  deviceId!: string;
}
