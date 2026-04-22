import { type SignUpResult } from '../../application/use-cases/sign-up-with-email-password';

/**
 * Public user data returned by the sign-up endpoint.
 */
class SignUpResponseUser {
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
 * HTTP response body returned after a successful sign-up.
 *
 * The DTO exposes expiration timestamps as ISO strings so the transport shape
 * matches the JSON representation sent over HTTP.
 */
export class SignUpResponse {
  /**
   * Newly created authenticated user data.
   */
  user!: SignUpResponseUser;

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
   * Builds the HTTP response DTO from the application-layer sign-up result.
   *
   * @param result Authenticated session payload returned by the sign-up use case.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromSignUpResult(result: SignUpResult): SignUpResponse {
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: result.refreshTokenExpiresAt.toISOString(),
    };
  }
}
