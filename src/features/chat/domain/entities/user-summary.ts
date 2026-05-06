/**
 * Domain entity representing one public user summary inside the chat feature.
 */
export class UserSummary {
  /**
   * Creates one immutable user summary.
   *
   * @param params User-summary data.
   * @param params.id Stable user identifier.
   * @param params.name Public user display name.
   * @returns A user-summary entity.
   */
  static create(params: { id: string; name: string }): UserSummary {
    return new UserSummary(params.id, params.name);
  }

  /**
   * Stores immutable user-summary state.
   *
   * @param id Stable user identifier.
   * @param name Public user display name.
   */
  private constructor(
    readonly id: string,
    readonly name: string,
  ) {}
}
