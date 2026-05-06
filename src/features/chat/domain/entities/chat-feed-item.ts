import { ChatFeedLastMessage } from './chat-feed-last-message';
import { ChatFeedMember } from './chat-feed-member';

/**
 * Domain entity representing one chat as it appears in the caller's chat feed.
 */
export class ChatFeedItem {
  /**
   * Creates one immutable chat-feed item.
   *
   * @param params Chat-feed item data.
   * @param params.id Stable chat identifier.
   * @param params.members Public member summaries shown in the feed.
   * @param params.lastMessage Latest message preview shown in the feed.
   * @returns A chat-feed item entity.
   */
  static create(params: {
    id: string;
    members: ChatFeedMember[];
    lastMessage: ChatFeedLastMessage | null;
  }): ChatFeedItem {
    return new ChatFeedItem(params.id, params.members, params.lastMessage);
  }

  /**
   * Stores immutable chat-feed item state.
   *
   * @param id Stable chat identifier.
   * @param members Public member summaries shown in the feed.
   * @param lastMessage Latest message preview shown in the feed.
   */
  private constructor(
    readonly id: string,
    readonly members: ChatFeedMember[],
    readonly lastMessage: ChatFeedLastMessage | null,
  ) {}
}
