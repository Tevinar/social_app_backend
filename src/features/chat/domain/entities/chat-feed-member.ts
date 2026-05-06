/**
 * Domain entity representing one public chat member shown in the chat feed.
 */
export class ChatFeedMember {
  /**
   * Creates one immutable chat-feed member.
   *
   * @param params Chat-feed member data.
   * @param params.id Stable member identifier.
   * @param params.name Public member display name.
   * @returns A chat-feed member entity.
   */
  static create(params: { id: string; name: string }): ChatFeedMember {
    return new ChatFeedMember(params.id, params.name);
  }

  /**
   * Stores immutable chat-feed member state.
   *
   * @param id Stable member identifier.
   * @param name Public member display name.
   */
  private constructor(
    readonly id: string,
    readonly name: string,
  ) {}
}
