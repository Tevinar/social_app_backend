import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { Chat } from '../../domain/entities/chat';
import { ChatFeedCursorPagination } from '../pagination/chat-feed.cursor';
import {
  CHAT_FEED_READER,
  type ChatFeedReader,
} from '../ports/chat-feed-reader.port';

/**
 * Application use case responsible for listing one cursor-based slice of chats
 * visible in the authenticated caller's feed.
 */
@Injectable()
export class GetChatFeedSliceUseCase implements UseCase<
  GetChatFeedSliceParams,
  ChatFeedSliceResponse
> {
  /**
   * Receives the capability required to read chat-feed items from persistence.
   *
   * @param chatFeedReader Reads chats visible in the caller's feed.
   */
  constructor(
    @Inject(CHAT_FEED_READER)
    private readonly chatFeedReader: ChatFeedReader,
  ) {}

  /**
   * Returns one cursor-based slice of chats for the authenticated caller.
   *
   * @param params Caller identity and requested slice window.
   * @returns Chat-feed slice data ready for presentation.
   */
  async execute(
    params: GetChatFeedSliceParams,
  ): Promise<ChatFeedSliceResponse> {
    const pagination = ChatFeedCursorPagination.from(
      params.limit,
      params.cursor,
    );

    const result = await this.chatFeedReader.findRecentSlice({
      userId: params.userId,
      limit: pagination.limit,
      ...(pagination.cursor ? { cursor: pagination.cursor } : {}),
    });

    const lastItem = result.items.at(-1);
    const nextCursor = lastItem
      ? ChatFeedCursorPagination.encodeCursor(
          lastItem.lastMessage?.createdAt ?? new Date(0),
          lastItem.id,
        )
      : undefined;

    return {
      items: result.items,
      ...(nextCursor ? { nextCursor } : {}),
    };
  }
}

export type GetChatFeedSliceParams = {
  userId: string;
  limit: number;
  cursor?: string;
};

export type ChatFeedSliceResponse = {
  items: Chat[];
  nextCursor?: string;
};
