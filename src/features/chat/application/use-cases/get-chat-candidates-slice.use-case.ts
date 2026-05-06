import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { ChatCandidateCursorPagination } from '../pagination/chat-candidate.cursor';
import {
  CHAT_CANDIDATE_READER,
  type ChatCandidateReader,
} from '../ports/chat-candidate-reader.port';
import { UserSummary } from '../../domain/entities/user-summary';

/**
 * Application use case responsible for listing one cursor-based slice of
 * users that may be selected to start a chat.
 */
@Injectable()
export class GetChatCandidatesSliceUseCase implements UseCase<
  GetChatCandidatesSliceParams,
  ChatCandidatesSliceResponse
> {
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

    const result = await this.chatCandidateReader.findSlice({
      userId: params.userId,
      limit: pagination.limit,
      ...(pagination.cursor ? { cursor: pagination.cursor } : {}),
    });

    const lastItem = result.items.at(-1);
    const nextCursor = lastItem
      ? ChatCandidateCursorPagination.encodeCursor(lastItem.name, lastItem.id)
      : undefined;

    return {
      items: result.items,
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
  items: UserSummary[];
  nextCursor?: string;
};
