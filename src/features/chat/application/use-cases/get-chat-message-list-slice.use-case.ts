import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { ChatMessage } from '../../domain/entities/chat-message';
import { ChatMessageListCursorPagination } from '../pagination/chat-message-list.cursor';
import {
  CHAT_MESSAGE_LIST_READER,
  type ChatMessageListReader,
} from '../ports/chat-message-list-reader.port';

/**
 * Application use case responsible for listing one cursor-based slice of
 * messages inside one chat visible to the authenticated caller.
 */
@Injectable()
export class GetChatMessageListSliceUseCase implements UseCase<
  GetChatMessageListSliceParams,
  ChatMessageListSliceResult
> {
  /**
   * Receives the capability required to read chat messages from persistence.
   *
   * @param chatMessageListReader Reads chat messages visible to the caller.
   */
  constructor(
    @Inject(CHAT_MESSAGE_LIST_READER)
    private readonly chatMessageListReader: ChatMessageListReader,
  ) {}

  /**
   * Returns one cursor-based slice of messages for the target chat.
   *
   * @param params Caller identity, target chat, and requested slice window.
   * @returns Chat-message slice data ready for presentation.
   */
  async execute(
    params: GetChatMessageListSliceParams,
  ): Promise<ChatMessageListSliceResult> {
    const pagination = ChatMessageListCursorPagination.from(
      params.limit,
      params.cursor,
    );

    const chatMessages = await this.chatMessageListReader.findRecentSlice({
      userId: params.userId,
      chatId: params.chatId,
      limit: pagination.limit,
      ...(pagination.cursor ? { cursor: pagination.cursor } : {}),
    });

    const lastItem = chatMessages.at(-1);
    const nextCursor = lastItem
      ? ChatMessageListCursorPagination.encodeCursor(
          lastItem.createdAt,
          lastItem.id,
        )
      : undefined;

    return {
      chatMessages: chatMessages,
      ...(nextCursor ? { nextCursor } : {}),
    };
  }
}

export type GetChatMessageListSliceParams = {
  userId: string;
  chatId: string;
  limit: number;
  cursor?: string;
};

export type ChatMessageListSliceResult = {
  chatMessages: ChatMessage[];
  nextCursor?: string;
};
