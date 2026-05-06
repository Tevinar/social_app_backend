/**
 * Domain entity representing one user currently eligible to appear in the
 * "start chat" candidate list.
 */
export class UserSummary {
  /**
   * Creates one immutable user summary.
   *
   * @param params User-summary data.
   * @param params.id Stable candidate identifier.
   * @param params.name Public candidate display name.
   * @returns A chat-candidate domain entity.
   */
  static create(params: { id: string; name: string }): UserSummary {
    return new UserSummary(params.id, params.name);
  }

  /**
   * Stores immutable user-summary state.
   *
   * @param id Stable candidate identifier.
   * @param name Public candidate display name.
   */
  private constructor(
    readonly id: string,
    readonly name: string,
  ) {}
}
