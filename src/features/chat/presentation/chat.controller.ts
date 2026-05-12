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
import { CreateChatMessageUseCase } from '../application/use-cases/create-chat-message.use-case';
import { CreateChatUseCase } from '../application/use-cases/create-chat.use-case';
import { GetChatByMembersUseCase } from '../application/use-cases/get-chat-by-members.use-case';
import { GetChatCandidateListSliceUseCase } from '../application/use-cases/get-chat-candidate-list-slice.use-case';
import { GetChatListSliceUseCase } from '../application/use-cases/get-chat-list-slice.use-case';
import { GetChatMessageListSliceUseCase } from '../application/use-cases/get-chat-message-list-slice.use-case';
import { SubscribeToChatListUseCase } from '../application/use-cases/subscribe-to-chat-list.use-case';
import { SubscribeToChatMessageListUseCase } from '../application/use-cases/subscribe-to-chat-message-list.use-case';
import { CreateChatMessageRequest } from './dto/requests/create-chat-message.request';
import { CreateChatRequest } from './dto/requests/create-chat.request';
import { GetChatByMembersRequest } from './dto/requests/get-chat-by-members.request';
import { GetChatCandidateListSliceRequest } from './dto/requests/get-chat-candidate-list-slice.request';
import { GetChatListSliceRequest } from './dto/requests/get-chat-list-slice.request';
import { GetChatMessageListSliceRequest } from './dto/requests/get-chat-message-list-slice.request';
import { GetChatMessageEventResponse } from './dto/responses/events/get-chat-message-event.response';
import { ChatMessageListSliceResponse } from './dto/responses/slices/chat-message-list-slice.response';
import { GetChatResponse } from './dto/responses/common/get-chat.response';
import { ChatWriteResponse } from './dto/responses/writes/chat-write.response';
import { GetChatListEventResponse } from './dto/responses/events/get-chat-list-event.response';
import { ChatCandidateListSliceResponse } from './dto/responses/slices/chat-candidate-list-slice.response';
import { ChatListSliceResponse } from './dto/responses/slices/chat-list-slice.response';
import { AuthenticatedUser } from '../../../app/auth/decorators/authenticated-user';
import { AccessTokenGuard } from '../../../app/auth/guards/access-tokens';
import { ApiStandardErrorResponses } from '../../../core/presentation/swagger/api-standard-error-responses.swagger';
import { ApiBearerAuth, ApiOkResponse, ApiProduces } from '@nestjs/swagger';

/**
 * HTTP controller exposing chat endpoints.
 *
 * This presentation adapter is responsible for request validation and mapping
 * use-case results into response DTOs.
 */
@ApiBearerAuth()
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
   * @param getChatListSliceUseCase Chat application service for listing
   * chat-list slices.
   * @param getChatMessageListSliceUseCase Chat application service for listing
   * chat-message slices.
   * @param subscribeToChatListUseCase Chat application service for live chat-list
   * events.
   * @param subscribeToChatMessageListChangesUseCase Chat application service for
   * live message events.
   */
  constructor(
    private readonly createChatUseCase: CreateChatUseCase,
    private readonly createChatMessageUseCase: CreateChatMessageUseCase,
    private readonly getChatByMembersUseCase: GetChatByMembersUseCase,
    private readonly getChatCandidatesSliceUseCase: GetChatCandidateListSliceUseCase,
    private readonly getChatListSliceUseCase: GetChatListSliceUseCase,
    private readonly getChatMessageListSliceUseCase: GetChatMessageListSliceUseCase,
    private readonly subscribeToChatListUseCase: SubscribeToChatListUseCase,
    private readonly subscribeToChatMessageListChangesUseCase: SubscribeToChatMessageListUseCase,
  ) {}

  /**
   * Creates a chat for the authenticated caller.
   *
   * @param body Validated chat creation request body.
   * @param auth Authenticated user identity resolved by the access-token guard.
   * @param auth.userId Stable identifier of the authenticated user.
   * @returns HTTP response DTO containing the created chat and first message.
   */
  @ApiStandardErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  )
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
   * @returns HTTP response DTO containing the requested chat-list slice.
   */
  @ApiStandardErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED)
  @Get()
  async getChatListSlice(
    @Query() query: GetChatListSliceRequest,
    @AuthenticatedUser()
    auth: { userId: string },
  ): Promise<ChatListSliceResponse> {
    const slice = await this.getChatListSliceUseCase.execute({
      userId: auth.userId,
      limit: query.limit,
      ...(query.cursor ? { cursor: query.cursor } : {}),
    });

    return ChatListSliceResponse.fromSlice(slice);
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
  @ApiStandardErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED)
  @Get('candidates')
  async getChatCandidateListSlice(
    @Query() query: GetChatCandidateListSliceRequest,
    @AuthenticatedUser()
    auth: { userId: string },
  ): Promise<ChatCandidateListSliceResponse> {
    const slice = await this.getChatCandidatesSliceUseCase.execute({
      userId: auth.userId,
      limit: query.limit,
      ...(query.cursor ? { cursor: query.cursor } : {}),
    });

    return ChatCandidateListSliceResponse.fromSlice(slice);
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
  @ApiStandardErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED)
  @ApiOkResponse({
    // Explicitly document the nullable response for Swagger, since it can't be
    // inferred from the TypeScript return type (here it is union).
    description: 'Matching chat when found, otherwise null.',
    type: GetChatResponse,
    nullable: true,
  })
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
   * Opens the live chat-list event stream for the authenticated caller.
   *
   * @param auth Authenticated user identity resolved by the access-token guard.
   * @param auth.userId Stable identifier of the authenticated user.
   * @returns Observable SSE stream of chat-list events.
   */
  @ApiStandardErrorResponses(HttpStatus.UNAUTHORIZED)
  // Swagger cannot infer it because this function returns a streamed
  // Observable<...>, and the actual event payload shape is hidden
  // inside the RxJS mapping logic rather than exposed as a plain DTO return type.
  @ApiProduces('text/event-stream')
  @ApiOkResponse({
    description:
      'SSE stream of chat-list events. Each emitted event contains a chat-list event payload.',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          example:
            'event: created\n' +
            'data: {"type":"created","chat":{"id":"chat-id","members":[{"id":"user-1","name":"Alice"}],"lastMessage":null}}\n\n',
        },
      },
    },
  })
  @Sse('events')
  subscribeToChatList(
    @AuthenticatedUser()
    auth: {
      userId: string;
    },
  ): Observable<MessageEvent> {
    return this.subscribeToChatListUseCase.execute(auth.userId).pipe(
      map(
        (event): MessageEvent => ({
          type: event.type,
          data: GetChatListEventResponse.fromChatListEvent(event),
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
  @ApiStandardErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  )
  @Get(':chatId/messages')
  async getChatMessageListSlice(
    @Param('chatId', new ParseUUIDPipe({ version: '4' })) chatId: string,
    @Query() query: GetChatMessageListSliceRequest,
    @AuthenticatedUser()
    auth: { userId: string },
  ): Promise<ChatMessageListSliceResponse> {
    const slice = await this.getChatMessageListSliceUseCase.execute({
      userId: auth.userId,
      chatId,
      limit: query.limit,
      ...(query.cursor ? { cursor: query.cursor } : {}),
    });

    return ChatMessageListSliceResponse.fromSlice(slice);
  }

  /**
   * Creates a new message inside the target chat for the authenticated caller.
   *
   * @param chatId Stable UUIDv4 chat identifier.
   * @param body Validated chat-message creation request body.
   * @param auth Authenticated user identity resolved by the access-token guard.
   * @param auth.userId Stable identifier of the authenticated user.
   * @returns HTTP response DTO containing the created message and updated list
   * item.
   */
  @ApiStandardErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  )
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
   * Opens the live chat-message event stream for one target chat visible to
   * the authenticated caller.
   *
   * @param chatId Stable UUIDv4 chat identifier.
   * @param auth Authenticated user identity resolved by the access-token guard.
   * @param auth.userId Stable identifier of the authenticated user.
   * @returns Observable SSE stream of chat-message events.
   */
  @ApiStandardErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
  )
  @ApiProduces('text/event-stream')
  @ApiOkResponse({
    description:
      'SSE stream of chat-message events. Each emitted event is sent as a server-sent event frame.',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          example:
            'event: created\n' +
            'data: {"type":"created","chatMessage":{"id":"message-id","chatId":"chat-id","author":{"id":"user-id","name":"Alice"},"content":"Hello","createdAt":"2026-05-12T10:00:00.000Z","updatedAt":"2026-05-12T10:00:00.000Z"}}\n\n',
        },
      },
    },
  })
  @Sse(':chatId/messages/events')
  subscribeToChatMessageListChanges(
    @Param('chatId', new ParseUUIDPipe({ version: '4' })) chatId: string,
    @AuthenticatedUser()
    auth: {
      userId: string;
    },
  ): Observable<MessageEvent> {
    return this.subscribeToChatMessageListChangesUseCase
      .execute({
        userId: auth.userId,
        chatId,
      })
      .pipe(
        map(
          (event): MessageEvent => ({
            type: event.type,
            data: GetChatMessageEventResponse.fromChatMessageEvent(event),
          }),
        ),
      );
  }
}
