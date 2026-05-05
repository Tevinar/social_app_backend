import {
  Controller,
  UsePipes,
  ValidationPipe,
  Post,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Body,
  UploadedFile,
  BadRequestException,
  Get,
  Query,
  Param,
  Res,
  UseGuards,
  Sse,
  type MessageEvent,
  ParseUUIDPipe,
} from '@nestjs/common';
import { type Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBlogUseCase } from '../application/use-cases/create-blog.use-case';
import { CreateBlogRequest } from './dto/requests/create-blog.request';
import { GetBlogImageUseCase } from '../application/use-cases/get-blog-image.use-case';
import { AccessTokenGuard } from '../../auth/presentation/guards/access-tokens';
import { AuthenticatedUser } from '../../auth/presentation/decorators/authenticated-user';
import { Observable, map } from 'rxjs';
import { SubscribeToBlogFeedUseCase } from '../application/use-cases/subscribe-to-blog-feed.use-case';
import { GetBlogByIdUseCase } from '../application/use-cases/get-blog-by-id.use-case';
import { ListBlogsCursorRequest } from './dto/requests/get-blog-feed-slice.request';
import { GetBlogResponse } from './dto/responses/get-blog.response';
import { ListBlogsResponse } from './dto/responses/get-blog-feed-slice.response';
import { GetBlogFeedSliceUseCase } from '../application/use-cases/get-blog-feed-slice.use-case';

/**
 * HTTP controller exposing blog endpoints.
 *
 * This presentation adapter is responsible for request validation, file
 * extraction, and mapping use-case results into response DTOs.
 */
@UseGuards(AccessTokenGuard)
@Controller('blogs')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
export class BlogController {
  /**
   * Receives the blog use cases used by the controller actions.
   *
   * @param createBlogUseCase Blog application service for blog creation.
   * @param getBlogFeedSliceUseCase Blog application service for listing blog slices.
   * @param getBlogImageUseCase Blog application service for resolving blog image redirects.
   * @param subscribeToBlogFeedUseCase Blog application service for opening the live
   * blog feed event stream.
   * @param getBlogByIdUseCase Blog application service for retrieving one blog by id.
   */
  constructor(
    private readonly createBlogUseCase: CreateBlogUseCase,
    private readonly getBlogFeedSliceUseCase: GetBlogFeedSliceUseCase,
    private readonly getBlogImageUseCase: GetBlogImageUseCase,
    private readonly subscribeToBlogFeedUseCase: SubscribeToBlogFeedUseCase,
    private readonly getBlogByIdUseCase: GetBlogByIdUseCase,
  ) {}

  /**
   * Creates a blog for the authenticated caller.
   *
   * The endpoint accepts multipart form data so text fields and the uploaded
   * image can be submitted in one request.
   *
   * @param body Validated blog creation request body.
   * @param image Uploaded image file extracted from the multipart request.
   * @param auth Authenticated user identity resolved by the access-token guard.
   * @param auth.userId Stable identifier of the authenticated blog author.
   * @returns HTTP response DTO containing the created blog data.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  async createBlog(
    @Body() body: CreateBlogRequest,
    @UploadedFile() image: Express.Multer.File | undefined,
    @AuthenticatedUser()
    auth: { userId: string },
  ): Promise<GetBlogResponse> {
    if (!image?.buffer) {
      throw new BadRequestException('Image file is required');
    }

    const blog = await this.createBlogUseCase.execute({
      userId: auth.userId,
      title: body.title,
      content: body.content,
      imageBuffer: image.buffer,
      topics: body.topics,
    });

    return GetBlogResponse.fromBlog(blog);
  }

  /**
   * Returns one cursor-based slice of blogs for the submitted query.
   *
   * @param query Validated cursor-pagination query string.
   * @returns HTTP response DTO containing the requested blog slice.
   */
  @Get()
  async getBlogFeedSlice(
    @Query() query: ListBlogsCursorRequest,
  ): Promise<ListBlogsResponse> {
    const slice = await this.getBlogFeedSliceUseCase.execute({
      limit: query.limit,
      ...(query.cursor ? { cursor: query.cursor } : {}),
    });

    return ListBlogsResponse.fromBlogFeedSlice(slice);
  }

  /**
   * Redirects the caller to a temporary signed URL for one blog image.
   *
   * @param blogId Stable identifier of the target blog.
   * @param response Express response object used to send the redirect.
   */
  @Get(':blogId/image')
  async getBlogImage(
    @Param('blogId') blogId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.getBlogImageUseCase.execute({ blogId });
    response.redirect(HttpStatus.TEMPORARY_REDIRECT, result.signedUrl);
  }

  /**
   * Opens a server-sent event stream that notifies clients when the blog feed
   * has newer content available.
   *
   * @returns Observable SSE stream of blog feed events.
   */
  @Sse('events')
  watchBlogFeedEvents(): Observable<MessageEvent> {
    return this.subscribeToBlogFeedUseCase.execute().pipe(
      map((event) => ({
        type: event.type,
        data: event,
      })),
    );
  }

  /**
   * Returns one blog by its stable identifier.
   *
   * @param blogId Stable UUIDv4 blog identifier.
   * @returns HTTP response DTO containing the requested blog.
   */
  @Get(':blogId')
  async getBlogById(
    @Param('blogId', new ParseUUIDPipe({ version: '4' })) blogId: string,
  ): Promise<GetBlogResponse> {
    const blog = await this.getBlogByIdUseCase.execute(blogId);
    return GetBlogResponse.fromBlog(blog);
  }
}
