import { Auth } from '../../../domain/entities/auth';
import { AuthUser } from '../../../domain/entities/auth-user';

/**
 * HTTP response body returned after a successful authentication flow.
 *
 * Shared by the sign-up and sign-in endpoints.
 *
 * The DTO exposes expiration timestamps as ISO strings so the transport shape
 * matches the JSON representation sent over HTTP.
 */
export class AuthResponse {
  /**
   * Authenticated user data exposed to the client.
   */
  user!: AuthResponseUser;

  /**
   * Newly issued access token.
   */
  accessToken!: string;

  /**
   * Newly issued refresh token.
   */
  refreshToken!: string;

  /**
   * Access-token expiration timestamp serialized as an ISO string.
   */
  accessTokenExpiresAt!: string;

  /**
   * Refresh-token expiration timestamp serialized as an ISO string.
   */
  refreshTokenExpiresAt!: string;

  /**
   * Builds the HTTP response DTO from one authenticated-session entity.
   *
   * @param auth Authenticated-session entity.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromAuth(auth: Auth): AuthResponse {
    return {
      user: AuthResponseUser.fromAuthUser(auth.user),
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      accessTokenExpiresAt: auth.accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: auth.refreshTokenExpiresAt.toISOString(),
    };
  }
}

/**
 * Public authenticated user data returned inside the auth response payload.
 */
class AuthResponseUser {
  /**
   * Stable user identifier.
   */
  id!: string;

  /**
   * User email address.
   */
  email!: string;

  /**
   * Public profile name.
   */
  name!: string;

  /**
   * Builds the user sub-payload from one authenticated-user entity.
   *
   * @param user Authenticated-user entity.
   * @returns Response user payload ready for JSON serialization.
   */
  static fromAuthUser(user: AuthUser): AuthResponseUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
