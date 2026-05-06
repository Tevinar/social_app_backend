import { AuthUser } from './auth-user';

/**
 * Domain entity representing a successfully authenticated session payload.
 */
export class Auth {
  /**
   * Creates one immutable authenticated-session entity.
   *
   * @param params Authenticated-session data.
   * @param params.user Authenticated user summary.
   * @param params.accessToken Newly issued access token.
   * @param params.refreshToken Newly issued refresh token.
   * @param params.accessTokenExpiresAt Access-token expiration timestamp.
   * @param params.refreshTokenExpiresAt Refresh-token expiration timestamp.
   * @returns An authenticated-session entity.
   */
  static create(params: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
  }): Auth {
    return new Auth(
      params.user,
      params.accessToken,
      params.refreshToken,
      params.accessTokenExpiresAt,
      params.refreshTokenExpiresAt,
    );
  }

  /**
   * Stores immutable authenticated-session state.
   *
   * @param user Authenticated user summary.
   * @param accessToken Newly issued access token.
   * @param refreshToken Newly issued refresh token.
   * @param accessTokenExpiresAt Access-token expiration timestamp.
   * @param refreshTokenExpiresAt Refresh-token expiration timestamp.
   */
  private constructor(
    readonly user: AuthUser,
    readonly accessToken: string,
    readonly refreshToken: string,
    readonly accessTokenExpiresAt: Date,
    readonly refreshTokenExpiresAt: Date,
  ) {}
}
