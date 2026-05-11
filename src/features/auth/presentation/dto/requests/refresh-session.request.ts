import { IsString, IsUUID, MinLength } from 'class-validator';

/**
 * HTTP request body accepted by the refresh-session endpoint.
 */
export class RefreshSessionRequest {
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
