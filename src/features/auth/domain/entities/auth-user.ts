/**
 * Domain entity representing the authenticated user's public session payload.
 */
export class AuthUser {
  /**
   * Creates one immutable authenticated-user entity.
   *
   * @param params Authenticated-user data.
   * @param params.id Stable user identifier.
   * @param params.email User email address.
   * @param params.name Public profile name.
   * @returns An authenticated-user entity.
   */
  static create(params: { id: string; email: string; name: string }): AuthUser {
    return new AuthUser(params.id, params.email, params.name);
  }

  /**
   * Stores immutable authenticated-user state.
   *
   * @param id Stable user identifier.
   * @param email User email address.
   * @param name Public profile name.
   */
  private constructor(
    readonly id: string,
    readonly email: string,
    readonly name: string,
  ) {}
}
