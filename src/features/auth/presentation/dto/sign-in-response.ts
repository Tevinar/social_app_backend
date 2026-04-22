import { type AuthSession } from '../../application/use-cases/sign-in-with-email-password';

/**
 * Public user data returned by the sign-in endpoint.
 */
class SignInResponseUser {
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
}

/**
 * HTTP response body returned after a successful sign-in.
 *
 * The DTO keeps transport concerns explicit by exposing expiration timestamps
 * as ISO strings, which matches the JSON representation the controller will
 * send over HTTP.
 */
export class SignInResponse {
  /**
   * Authenticated user data.
   */
  user!: SignInResponseUser;

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
   * Builds the HTTP response DTO from the application-layer auth session.
   *
   * @param session Auth session returned by the sign-in use case.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromAuthSession(session: AuthSession): SignInResponse {
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      accessTokenExpiresAt: session.accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: session.refreshTokenExpiresAt.toISOString(),
    };
  }
}
