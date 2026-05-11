import { Inject, Injectable } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { ChatCandidateListCursorPagination } from '../pagination/chat-candidate.cursor';
import {
  CHAT_CANDIDATE_READER,
  type ChatCandidateListReader,
} from '../ports/chat-candidate-list-reader.port';
import { UserSummary } from '../../domain/entities/user-summary';

/**
 * Application use case responsible for listing one cursor-based slice of
 * users that may be selected to start a chat.
 */
@Injectable()
export class GetChatCandidateListSliceUseCase implements UseCase<
  GetChatCandidateListSliceParams,
  ChatCandidateListSliceResult
> {
  /**
   * Receives the capability required to read chat candidates from persistence.
   *
   * @param chatCandidateReader Reads chat candidates visible to the caller.
   */
  constructor(
    @Inject(CHAT_CANDIDATE_READER)
    private readonly chatCandidateReader: ChatCandidateListReader,
  ) {}

  /**
   * Returns one cursor-based slice of chat candidates for the authenticated
   * caller.
   *
   * @param params Caller identity and requested slice window.
   * @returns Candidate slice data ready for presentation.
   */
  async execute(
    params: GetChatCandidateListSliceParams,
  ): Promise<ChatCandidateListSliceResult> {
    const pagination = ChatCandidateListCursorPagination.from(
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
      ? ChatCandidateListCursorPagination.encodeCursor(
          lastItem.name,
          lastItem.id,
        )
      : undefined;

    return {
      items: result.items,
      ...(nextCursor ? { nextCursor } : {}),
    };
  }
}

export type GetChatCandidateListSliceParams = {
  userId: string;
  limit: number;
  cursor?: string;
};

export type ChatCandidateListSliceResult = {
  items: UserSummary[];
  nextCursor?: string;
};
