import { UserSummary } from './user-summary';

/**
 * Domain entity representing one public chat.
 */
export class Chat {
  /**
   * Creates one immutable chat entity.
   *
   * @param params Chat data.
   * @param params.id Stable chat identifier.
   * @param params.members Public chat members.
   * @returns A chat entity.
   */
  static create(params: { id: string; members: UserSummary[] }): Chat {
    return new Chat(params.id, params.members);
  }

  /**
   * Stores immutable chat state.
   *
   * @param id Stable chat identifier.
   * @param members Public chat members.
   */
  private constructor(
    readonly id: string,
    readonly members: UserSummary[],
  ) {}
}
