import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Observable, Subscription, map } from 'rxjs';
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
import { type Request, type Response } from 'express';

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
  private static readonly SSE_KEEPALIVE_INTERVAL_MS = 15_000;

  private readonly logger = new Logger(ChatController.name);

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
   * @param request Incoming HTTP request kept open for the SSE subscription.
   * @param response Outgoing HTTP response used to stream SSE frames directly.
   */
  @ApiStandardErrorResponses(HttpStatus.UNAUTHORIZED)
  // Swagger cannot infer the streamed payload shape because the response is a
  // manually written SSE stream rather than a regular JSON DTO.
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
  @Get('events')
  subscribeToChatList(
    @AuthenticatedUser()
    auth: {
      userId: string;
    },
    @Req() request: Request,
    @Res() response: Response,
  ): void {
    this.openSseStream(
      request,
      response,
      this.subscribeToChatListUseCase.execute(auth.userId).pipe(
        map(
          (event): MessageEvent => ({
            type: event.type,
            data: GetChatListEventResponse.fromChatListEvent(event),
          }),
        ),
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
   * @param request Incoming HTTP request kept open for the SSE subscription.
   * @param response Outgoing HTTP response used to stream SSE frames directly.
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
  @Get(':chatId/messages/events')
  subscribeToChatMessageListChanges(
    @Param('chatId', new ParseUUIDPipe({ version: '4' })) chatId: string,
    @AuthenticatedUser()
    auth: {
      userId: string;
    },
    @Req() request: Request,
    @Res() response: Response,
  ): void {
    this.openSseStream(
      request,
      response,
      this.subscribeToChatMessageListChangesUseCase
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
        ),
    );
  }

  /**
   * Streams SSE frames manually so the backend can emit protocol-level comment
   * keepalives during idle periods. Nest's public `@Sse()` helper serializes
   * normal events but does not expose protocol comment heartbeats, so the
   * controller has to write the stream output itself. GKE closes silent
   * streaming responses after roughly 30 seconds, and these comments keep the
   * connection active without changing the chat event payload shape that the
   * client already consumes.
   *
   * @param request Incoming HTTP request whose socket is upgraded for
   * streaming.
   * @param response Express response used to write SSE frames directly.
   * @param source$ Observable source of chat events to serialize as SSE.
   */
  private openSseStream(
    request: Request,
    response: Response,
    source$: Observable<MessageEvent>,
  ): void {
    // Convert one Nest MessageEvent into the raw SSE frame text that gets
    // written to the HTTP response.
    const serializeMessage = (message: MessageEvent): string => {
      // SSE control fields like `event:` and `id:` must stay on one line, so
      // strip any CR/LF characters before writing them into the stream.
      const sanitize = (value: string | number): string =>
        String(value).replace(/[\r\n]/g, '');

      const payload =
        typeof message.data === 'string'
          ? message.data
          : JSON.stringify(message.data ?? null);

      let frame = message.type ? `event: ${sanitize(message.type)}\n` : '';
      frame += message.id ? `id: ${sanitize(message.id)}\n` : '';
      frame += message.retry ? `retry: ${sanitize(message.retry)}\n` : '';
      frame += payload
        .split(/\r\n|\r|\n/)
        .map((line) => `data: ${line}\n`)
        .join('');
      frame += '\n';

      return frame;
    };

    // Mirror Nest's built-in SSE stream helper defaults now that this
    // controller writes the stream manually: keep the TCP socket alive,
    // disable Nagle buffering, and remove the socket inactivity timeout.
    request.socket.setKeepAlive(true);
    request.socket.setNoDelay(true);
    request.socket.setTimeout(0);

    // SSE subscriptions stay on the initial HTTP 200 response while the body
    // remains open and receives event frames over time.
    response.status(HttpStatus.OK);
    response.set({
      // Tell the client and intermediaries that this response is an SSE stream.
      'Content-Type': 'text/event-stream',
      // Keep the HTTP connection open for incremental event delivery.
      Connection: 'keep-alive',
      // Prevent browsers and proxies from caching or transforming the live
      // stream response.
      'Cache-Control':
        'private, no-cache, no-store, must-revalidate, max-age=0, no-transform',
    });
    // Send the headers immediately so the client can treat the response as an
    // active SSE stream without waiting for the first application event.
    response.flushHeaders();
    // Start the body with a blank line, matching Nest's SSE stream helper and
    // confirming the stream is open before any real event arrives.
    response.write('\n');

    const streamSubscription = new Subscription();
    let isClosed = false;

    // Tear down the timer, RxJS subscription, and HTTP response exactly once
    // when the client disconnects, the stream completes, or an error occurs.
    const cleanup = (): void => {
      if (isClosed) {
        return;
      }

      isClosed = true;
      clearInterval(keepaliveInterval);
      streamSubscription.unsubscribe();
      request.off('close', cleanup);
      response.off('close', cleanup);

      if (!response.writableEnded) {
        response.end();
      }
    };

    // Emit protocol-level SSE comments often enough to keep the stream from
    // looking idle to the load balancer when no chat events are flowing yet.
    const keepaliveInterval = setInterval(() => {
      // only write if the stream has not already been closed
      if (!response.writableEnded) {
        response.write(': keepalive\n\n');
      }
    }, ChatController.SSE_KEEPALIVE_INTERVAL_MS);

    streamSubscription.add(
      source$.subscribe({
        next: (event) => {
          // only write if the stream has not already been closed
          if (!response.writableEnded) {
            response.write(serializeMessage(event));
          }
        },
        error: (error) => {
          this.logger.error(
            `SSE stream failed: ${request.method} ${request.url}`,
            error instanceof Error ? error.stack : 'No stack trace available',
          );
          cleanup();
        },
        complete: cleanup,
      }),
    );

    request.on('close', cleanup);
    response.on('close', cleanup);
  }
}
