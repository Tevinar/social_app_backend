import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/presentation/guards/access-tokens';
import { AuthenticatedUser } from '../../auth/presentation/decorators/authenticated-user';
import { GetChatCandidatesSliceUseCase } from '../application/use-cases/get-chat-candidates-slice.use-case';
import { GetChatCandidatesSliceRequest } from './dto/requests/get-chat-candidates-slice.request';
import { GetChatCandidatesSliceResponse } from './dto/responses/get-chat-candidates-slice.response';

/**
 * HTTP controller exposing chat endpoints.
 *
 * This presentation adapter is responsible for request validation and mapping
 * use-case results into response DTOs.
 */
@UseGuards(AccessTokenGuard)
@Controller('chats')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
export class ChatController {
  /**
   * Receives the chat use cases used by the controller actions.
   *
   * @param getChatCandidatesSliceUseCase Chat application service for listing
   * chat candidates.
   */
  constructor(
    private readonly getChatCandidatesSliceUseCase: GetChatCandidatesSliceUseCase,
  ) {}

  /**
   * Returns one cursor-based slice of chat candidates for the authenticated
   * caller.
   *
   * @param query Validated cursor-pagination query string.
   * @param auth Authenticated user identity resolved by the access-token guard.
   * @param auth.userId Stable identifier of the authenticated user.
   * @returns HTTP response DTO containing the requested candidate slice.
   */
  @Get('candidates')
  async getChatCandidatesSlice(
    @Query() query: GetChatCandidatesSliceRequest,
    @AuthenticatedUser()
    auth: { userId: string },
  ): Promise<GetChatCandidatesSliceResponse> {
    const slice = await this.getChatCandidatesSliceUseCase.execute({
      userId: auth.userId,
      limit: query.limit,
      ...(query.cursor ? { cursor: query.cursor } : {}),
    });

    return GetChatCandidatesSliceResponse.fromChatCandidatesSlice(slice);
  }
}
