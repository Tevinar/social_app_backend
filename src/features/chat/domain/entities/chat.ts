import { ChatLastMessage } from './chat-last-message';
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
   * @param params.members Public member summaries shown for the chat.
   * @param params.lastMessage Latest message preview shown for the chat.
   * @returns A chat entity.
   */
  static create(params: {
    id: string;
    members: UserSummary[];
    lastMessage: ChatLastMessage | null;
  }): Chat {
    return new Chat(params.id, params.members, params.lastMessage);
  }

  /**
   * Stores immutable chat state.
   *
   * @param id Stable chat identifier.
   * @param members Public member summaries shown for the chat.
   * @param lastMessage Latest message preview shown for the chat.
   */
  private constructor(
    readonly id: string,
    readonly members: UserSummary[],
    readonly lastMessage: ChatLastMessage | null,
  ) {}
}
