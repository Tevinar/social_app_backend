import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { ChatCandidateCursorPagination } from '../chat-candidate-cursor/chat-candidate-cursor';
import { ChatCandidateModel } from '../models/chat-candidate.model';
import {
  CHAT_CANDIDATE_READER,
  type ChatCandidateReader,
} from '../ports/chat-candidate-reader.port';

/**
 * Application use case responsible for listing one cursor-based slice of
 * users that may be selected to start a chat.
 */
@Injectable()
export class GetChatCandidatesSliceUseCase
  implements UseCase<GetChatCandidatesSliceParams, ChatCandidatesSliceResponse>
{
  /**
   * Receives the capability required to read chat candidates from persistence.
   *
   * @param chatCandidateReader Reads chat candidates visible to the caller.
   */
  constructor(
    @Inject(CHAT_CANDIDATE_READER)
    private readonly chatCandidateReader: ChatCandidateReader,
  ) {}

  /**
   * Returns one cursor-based slice of chat candidates for the authenticated
   * caller.
   *
   * @param params Caller identity and requested slice window.
   * @returns Candidate slice data ready for presentation.
   */
  async execute(
    params: GetChatCandidatesSliceParams,
  ): Promise<ChatCandidatesSliceResponse> {
    const pagination = ChatCandidateCursorPagination.from(
      params.limit,
      params.cursor,
    );

    const result = await this.chatCandidateReader.findRecentSlice({
      userId: params.userId,
      limit: pagination.limit,
      ...(pagination.cursor ? { cursor: pagination.cursor } : {}),
    });

    const lastItem = result.items.at(-1);
    const nextCursor = lastItem
      ? ChatCandidateCursorPagination.encodeCursor(
          lastItem.createdAt,
          lastItem.id,
        )
      : undefined;

    return {
      items: result.items.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
      })),
      ...(nextCursor ? { nextCursor } : {}),
    };
  }
}

export type GetChatCandidatesSliceParams = {
  userId: string;
  limit: number;
  cursor?: string;
};

export type ChatCandidatesSliceResponse = {
  items: ChatCandidateModel[];
  nextCursor?: string;
};
