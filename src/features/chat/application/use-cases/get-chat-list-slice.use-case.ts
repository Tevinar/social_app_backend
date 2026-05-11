import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { Chat } from '../../domain/entities/chat';
import { ChatListCursorPagination } from '../pagination/chat-list.cursor';
import {
  CHAT_LIST_READER,
  type ChatListReader,
} from '../ports/chat-list-reader.port';

/**
 * Application use case responsible for listing one cursor-based slice of chats
 * visible in the authenticated caller's list.
 */
@Injectable()
export class GetChatListSliceUseCase implements UseCase<
  GetChatListSliceParams,
  ChatListSliceResult
> {
  /**
   * Receives the capability required to read chat-list items from persistence.
   *
   * @param chatListReader Reads chats visible in the caller's list.
   */
  constructor(
    @Inject(CHAT_LIST_READER)
    private readonly chatListReader: ChatListReader,
  ) {}

  /**
   * Returns one cursor-based slice of chats for the authenticated caller.
   *
   * @param params Caller identity and requested slice window.
   * @returns Chat-list slice data ready for presentation.
   */
  async execute(params: GetChatListSliceParams): Promise<ChatListSliceResult> {
    const pagination = ChatListCursorPagination.from(
      params.limit,
      params.cursor,
    );

    const result = await this.chatListReader.findRecentSlice({
      userId: params.userId,
      limit: pagination.limit,
      ...(pagination.cursor ? { cursor: pagination.cursor } : {}),
    });

    const lastItem = result.items.at(-1);
    const nextCursor = lastItem
      ? ChatListCursorPagination.encodeCursor(
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

export type GetChatListSliceParams = {
  userId: string;
  limit: number;
  cursor?: string;
};

export type ChatListSliceResult = {
  items: Chat[];
  nextCursor?: string;
};
