import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Sse,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { AccessTokenGuard } from '../../auth/presentation/guards/access-tokens';
import { AuthenticatedUser } from '../../auth/presentation/decorators/authenticated-user';
import { CreateChatMessageUseCase } from '../application/use-cases/create-chat-message.use-case';
import { CreateChatUseCase } from '../application/use-cases/create-chat.use-case';
import { GetChatByMembersUseCase } from '../application/use-cases/get-chat-by-members.use-case';
import { GetChatCandidatesSliceUseCase } from '../application/use-cases/get-chat-candidates-slice.use-case';
import { GetChatFeedSliceUseCase } from '../application/use-cases/get-chat-feed-slice.use-case';
import { GetChatMessageFeedSliceUseCase } from '../application/use-cases/get-chat-message-feed-slice.use-case';
import { SubscribeToChatFeedUseCase } from '../application/use-cases/subscribe-to-chat-feed.use-case';
import { SubscribeToChatMessageChangesUseCase } from '../application/use-cases/subscribe-to-chat-message-changes.use-case';
import { CreateChatMessageRequest } from './dto/requests/create-chat-message.request';
import { CreateChatRequest } from './dto/requests/create-chat.request';
import { GetChatByMembersRequest } from './dto/requests/get-chat-by-members.request';
import { GetChatCandidatesSliceRequest } from './dto/requests/get-chat-candidates-slice.request';
import { GetChatFeedSliceRequest } from './dto/requests/get-chat-feed-slice.request';
import { GetChatMessageFeedSliceRequest } from './dto/requests/get-chat-message-feed-slice.request';
import { GetChatMessageEventResponse } from './dto/responses/events/get-chat-message-event.response';
import { GetChatMessageFeedSliceResponse } from './dto/responses/slices/get-chat-message-feed-slice.response';
import { GetChatResponse } from './dto/responses/common/get-chat.response';
import { ChatWriteResponse } from './dto/responses/writes/chat-write.response';
import { GetChatFeedEventResponse } from './dto/responses/events/get-chat-feed-event.response';
import { GetChatCandidatesSliceResponse } from './dto/responses/slices/get-chat-candidates-slice.response';
import { GetChatFeedSliceResponse } from './dto/responses/slices/get-chat-feed-slice.response';

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
   * @param createChatUseCase Chat application service for chat creation.
   * @param createChatMessageUseCase Chat application service for message
   * creation.
   * @param getChatByMembersUseCase Chat application service for exact
   * member-set lookup.
   * @param getChatCandidatesSliceUseCase Chat application service for listing
   * chat candidates.
   * @param getChatFeedSliceUseCase Chat application service for listing
   * chat-feed slices.
   * @param getChatMessageFeedSliceUseCase Chat application service for listing
   * chat-message slices.
   * @param subscribeToChatFeedUseCase Chat application service for live feed
   * events.
   * @param subscribeToChatMessageChangesUseCase Chat application service for
   * live message events.
   */
  constructor(
    private readonly createChatUseCase: CreateChatUseCase,
    private readonly createChatMessageUseCase: CreateChatMessageUseCase,
    private readonly getChatByMembersUseCase: GetChatByMembersUseCase,
    private readonly getChatCandidatesSliceUseCase: GetChatCandidatesSliceUseCase,
    private readonly getChatFeedSliceUseCase: GetChatFeedSliceUseCase,
    private readonly getChatMessageFeedSliceUseCase: GetChatMessageFeedSliceUseCase,
    private readonly subscribeToChatFeedUseCase: SubscribeToChatFeedUseCase,
    private readonly subscribeToChatMessageChangesUseCase: SubscribeToChatMessageChangesUseCase,
  ) {}

  /**
   * Creates a chat for the authenticated caller.
   *
   * @param body Validated chat creation request body.
   * @param auth Authenticated user identity resolved by the access-token guard.
   * @param auth.userId Stable identifier of the authenticated user.
   * @returns HTTP response DTO containing the created chat and first message.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createChat(
    @Body() body: CreateChatRequest,
    @AuthenticatedUser()
    auth: { userId: string },
  ): Promise<ChatWriteResponse> {
    const result = await this.createChatUseCase.execute({
      userId: auth.userId,
      members: body.members,
      firstMessageContent: body.firstMessageContent,
    });

    return ChatWriteResponse.fromChatWriteResult(result);
  }

  /**
   * Returns one cursor-based slice of chats for the authenticated caller.
   *
   * @param query Validated cursor-pagination query string.
   * @param auth Authenticated user identity resolved by the access-token guard.
   * @param auth.userId Stable identifier of the authenticated user.
   * @returns HTTP response DTO containing the requested chat-feed slice.
   */
  @Get()
  async getChatFeedSlice(
    @Query() query: GetChatFeedSliceRequest,
    @AuthenticatedUser()
    auth: { userId: string },
  ): Promise<GetChatFeedSliceResponse> {
    const slice = await this.getChatFeedSliceUseCase.execute({
      userId: auth.userId,
      limit: query.limit,
      ...(query.cursor ? { cursor: query.cursor } : {}),
    });

    return GetChatFeedSliceResponse.fromChatFeedSlice(slice);
  }

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

  /**
   * Returns one existing chat matching the authenticated caller plus the
   * submitted member set.
   *
   * @param query Validated member-set query string.
   * @param auth Authenticated user identity resolved by the access-token guard.
   * @param auth.userId Stable identifier of the authenticated user.
   * @returns Matching chat when found, otherwise null.
   */
  @Get('by-members')
  async getChatByMembers(
    @Query() query: GetChatByMembersRequest,
    @AuthenticatedUser()
    auth: { userId: string },
  ): Promise<GetChatResponse | null> {
    const chat = await this.getChatByMembersUseCase.execute({
      userId: auth.userId,
      members: query.members,
    });

    return chat ? GetChatResponse.fromChat(chat) : null;
  }

  /**
   * Opens the live chat-feed event stream for the authenticated caller.
   *
   * @param auth Authenticated user identity resolved by the access-token guard.
   * @param auth.userId Stable identifier of the authenticated user.
   * @returns Observable SSE stream of chat-feed events.
   */
  @Sse('feed/events')
  subscribeToChatFeed(
    @AuthenticatedUser()
    auth: {
      userId: string;
    },
  ): Observable<MessageEvent> {
    return this.subscribeToChatFeedUseCase.execute(auth.userId).pipe(
      map(
        (event): MessageEvent => ({
          type: event.type,
          data: GetChatFeedEventResponse.fromChatFeedEvent(event),
        }),
      ),
    );
  }

  /**
   * Returns one cursor-based slice of chat messages for the target chat.
   *
   * @param chatId Stable UUIDv4 chat identifier.
   * @param query Validated cursor-pagination query string.
   * @param auth Authenticated user identity resolved by the access-token guard.
   * @param auth.userId Stable identifier of the authenticated user.
   * @returns HTTP response DTO containing the requested chat-message slice.
   */
  @Get(':chatId/messages')
  async getChatMessageFeedSlice(
    @Param('chatId', new ParseUUIDPipe({ version: '4' })) chatId: string,
    @Query() query: GetChatMessageFeedSliceRequest,
    @AuthenticatedUser()
    auth: { userId: string },
  ): Promise<GetChatMessageFeedSliceResponse> {
    const slice = await this.getChatMessageFeedSliceUseCase.execute({
      userId: auth.userId,
      chatId,
      limit: query.limit,
      ...(query.cursor ? { cursor: query.cursor } : {}),
    });

    return GetChatMessageFeedSliceResponse.fromChatMessageFeedSlice(slice);
  }

  /**
   * Creates a new message inside the target chat for the authenticated caller.
   *
   * @param chatId Stable UUIDv4 chat identifier.
   * @param body Validated chat-message creation request body.
   * @param auth Authenticated user identity resolved by the access-token guard.
   * @param auth.userId Stable identifier of the authenticated user.
   * @returns HTTP response DTO containing the created message and updated feed
   * item.
   */
  @Post(':chatId/messages')
  @HttpCode(HttpStatus.CREATED)
  async createChatMessage(
    @Param('chatId', new ParseUUIDPipe({ version: '4' })) chatId: string,
    @Body() body: CreateChatMessageRequest,
    @AuthenticatedUser()
    auth: { userId: string },
  ): Promise<ChatWriteResponse> {
    const result = await this.createChatMessageUseCase.execute({
      userId: auth.userId,
      chatId,
      content: body.content,
    });

    return ChatWriteResponse.fromChatWriteResult(result);
  }

  /**
   * Opens the live chat-message event stream for the authenticated caller.
   *
   * @param auth Authenticated user identity resolved by the access-token guard.
   * @param auth.userId Stable identifier of the authenticated user.
   * @returns Observable SSE stream of chat-message events.
   */
  @Sse('messages/events')
  subscribeToChatMessageChanges(
    @AuthenticatedUser()
    auth: {
      userId: string;
    },
  ): Observable<MessageEvent> {
    return this.subscribeToChatMessageChangesUseCase.execute(auth.userId).pipe(
      map(
        (event): MessageEvent => ({
          type: event.type,
          data: GetChatMessageEventResponse.fromChatMessageEvent(event),
        }),
      ),
    );
  }
}
