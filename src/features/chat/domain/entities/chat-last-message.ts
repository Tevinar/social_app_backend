import { UserSummary } from './user-summary';

/**
 * Domain entity representing the latest message preview shown for one chat.
 */
export class ChatLastMessage {
  /**
   * Creates one immutable last-message preview.
   *
   * @param params Last-message data.
   * @param params.id Stable message identifier.
   * @param params.author Message author when still available.
   * @param params.content Public message preview content.
   * @param params.createdAt Message creation timestamp.
   * @returns A chat last-message entity.
   */
  static create(params: {
    id: string;
    author: UserSummary | null;
    content: string;
    createdAt: Date;
  }): ChatLastMessage {
    return new ChatLastMessage(
      params.id,
      params.author,
      params.content,
      params.createdAt,
    );
  }

  /**
   * Stores immutable last-message preview state.
   *
   * @param id Stable message identifier.
   * @param author Message author when still available.
   * @param content Public message preview content.
   * @param createdAt Message creation timestamp.
   */
  private constructor(
    readonly id: string,
    readonly author: UserSummary | null,
    readonly content: string,
    readonly createdAt: Date,
  ) {}
}
