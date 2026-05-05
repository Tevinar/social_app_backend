import { AuthModel } from '../../../application/models/auth.model';

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
   * Builds the HTTP response DTO from the application-layer auth model.
   *
   * @param model Authenticated session payload returned by the application
   * layer.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromAuthModel(model: AuthModel): AuthResponse {
    return {
      user: AuthResponseUser.fromModel(model.user),
      accessToken: model.accessToken,
      refreshToken: model.refreshToken,
      accessTokenExpiresAt: model.accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: model.refreshTokenExpiresAt.toISOString(),
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
   * Builds the user sub-payload from the application-layer auth model.
   *
   * @param user Authenticated user data returned by the application layer.
   * @returns Response user payload ready for JSON serialization.
   */
  static fromModel(user: AuthModel['user']): AuthResponseUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
