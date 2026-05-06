import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { ChatMessage } from '../../domain/entities/chat-message';
import { ChatMessageCursorPagination } from '../pagination/chat-message.cursor';
import {
  CHAT_MESSAGE_FEED_READER,
  type ChatMessageFeedReader,
} from '../ports/chat-message-feed-reader.port';

/**
 * Application use case responsible for listing one cursor-based slice of
 * messages inside one chat visible to the authenticated caller.
 */
@Injectable()
export class GetChatMessageFeedSliceUseCase implements UseCase<
  GetChatMessageFeedSliceParams,
  ChatMessageFeedSliceResponse
> {
  /**
   * Receives the capability required to read chat messages from persistence.
   *
   * @param chatMessageFeedReader Reads chat messages visible to the caller.
   */
  constructor(
    @Inject(CHAT_MESSAGE_FEED_READER)
    private readonly chatMessageFeedReader: ChatMessageFeedReader,
  ) {}

  /**
   * Returns one cursor-based slice of messages for the target chat.
   *
   * @param params Caller identity, target chat, and requested slice window.
   * @returns Chat-message slice data ready for presentation.
   */
  async execute(
    params: GetChatMessageFeedSliceParams,
  ): Promise<ChatMessageFeedSliceResponse> {
    const pagination = ChatMessageCursorPagination.from(
      params.limit,
      params.cursor,
    );

    const chatMessages = await this.chatMessageFeedReader.findRecentSlice({
      userId: params.userId,
      chatId: params.chatId,
      limit: pagination.limit,
      ...(pagination.cursor ? { cursor: pagination.cursor } : {}),
    });

    const lastItem = chatMessages.at(-1);
    const nextCursor = lastItem
      ? ChatMessageCursorPagination.encodeCursor(
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

export type GetChatMessageFeedSliceParams = {
  userId: string;
  chatId: string;
  limit: number;
  cursor?: string;
};

export type ChatMessageFeedSliceResponse = {
  chatMessages: ChatMessage[];
  nextCursor?: string;
};
