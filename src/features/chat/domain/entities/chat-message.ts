import { UserSummary } from './user-summary';

/**
 * Domain entity representing one public chat message.
 */
export class ChatMessage {
  /**
   * Creates one immutable chat-message entity.
   *
   * @param params Chat-message data.
   * @param params.id Stable message identifier.
   * @param params.chatId Stable parent chat identifier.
   * @param params.author Message author when still available.
   * @param params.content Public message content.
   * @param params.createdAt Message creation timestamp.
   * @param params.updatedAt Last message update timestamp.
   * @returns A chat-message entity.
   */
  static create(params: {
    id: string;
    chatId: string;
    author: UserSummary | null;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }): ChatMessage {
    return new ChatMessage(
      params.id,
      params.chatId,
      params.author,
      params.content,
      params.createdAt,
      params.updatedAt,
    );
  }

  /**
   * Stores immutable chat-message state.
   *
   * @param id Stable message identifier.
   * @param chatId Stable parent chat identifier.
   * @param author Message author when still available.
   * @param content Public message content.
   * @param createdAt Message creation timestamp.
   * @param updatedAt Last message update timestamp.
   */
  private constructor(
    readonly id: string,
    readonly chatId: string,
    readonly author: UserSummary | null,
    readonly content: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}
}
