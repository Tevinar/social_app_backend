import { IsString, IsUUID, MinLength } from 'class-validator';

/**
 * HTTP request body accepted by the current-session sign-out endpoint.
 */
export class SignOutCurrentSessionRequest {
  /**
   * Refresh token submitted by the caller.
   */
  @IsString()
  @MinLength(1)
  refreshToken!: string;

  /**
   * App-scoped client installation identifier.
   */
  @IsUUID(4)
  deviceId!: string;
}
