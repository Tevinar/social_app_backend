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
import { CreateBlogUseCase } from '../application/use-cases/create-blog';
import { CreateBlogRequest } from './dto/requests/create-blog.request';
import { ListBlogsUseCase } from '../application/use-cases/list-blogs';
import { GetBlogImageUseCase } from '../application/use-cases/get-blog-image';
import { AccessTokenGuard } from '../../auth/presentation/guards/access-tokens';
import { AuthenticatedUser } from '../../auth/presentation/decorators/authenticated-user';
import { Observable, map } from 'rxjs';
import { SubscribeToBlogFeedUseCase } from '../application/use-cases/subscribe-to-blog-feed-use-case';
import { GetBlogByIdUseCase } from '../application/use-cases/get-blog-by-id';
import { ListBlogsCursorRequest } from './dto/requests/list-blogs.request';
import { BlogResponse } from './dto/responses/blog.response';
import { ListBlogsResponse } from './dto/responses/list-blogs.response';

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
   * @param createBlog Blog application service for blog creation.
   * @param listBlogs Blog application service for listing blog slices.
   * @param getBlogImage Blog application service for resolving blog image redirects.
   * @param subscribeToBlogFeed Blog application service for opening the live
   * blog feed event stream.
   * @param getBlogById Blog application service for retrieving one blog by id.
   */
  constructor(
    private readonly createBlog: CreateBlogUseCase,
    private readonly listBlogs: ListBlogsUseCase,
    private readonly getBlogImage: GetBlogImageUseCase,
    private readonly subscribeToBlogFeed: SubscribeToBlogFeedUseCase,
    private readonly getBlogById: GetBlogByIdUseCase,
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
  async create(
    @Body() body: CreateBlogRequest,
    @UploadedFile() image: Express.Multer.File | undefined,
    @AuthenticatedUser()
    auth: { userId: string },
  ): Promise<BlogResponse> {
    if (!image?.buffer) {
      throw new BadRequestException('Image file is required');
    }

    const blog = await this.createBlog.execute({
      userId: auth.userId,
      title: body.title,
      content: body.content,
      imageBuffer: image.buffer,
      topics: body.topics,
    });

    return BlogResponse.fromBlog(blog);
  }

  /**
   * Returns one cursor-based slice of blogs for the submitted query.
   *
   * @param query Validated cursor-pagination query string.
   * @returns HTTP response DTO containing the requested blog slice.
   */
  @Get()
  async list(
    @Query() query: ListBlogsCursorRequest,
  ): Promise<ListBlogsResponse> {
    const slice = await this.listBlogs.execute({
      limit: query.limit,
      ...(query.cursor ? { cursor: query.cursor } : {}),
    });

    return ListBlogsResponse.fromListedBlogsSlice(slice);
  }

  /**
   * Redirects the caller to a temporary signed URL for one blog image.
   *
   * @param blogId Stable identifier of the target blog.
   * @param response Express response object used to send the redirect.
   */
  @Get(':blogId/image')
  async getImage(
    @Param('blogId') blogId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.getBlogImage.execute({ blogId });
    response.redirect(HttpStatus.TEMPORARY_REDIRECT, result.signedUrl);
  }

  /**
   * Opens a server-sent event stream that notifies clients when the blog feed
   * has newer content available.
   *
   * @returns Observable SSE stream of blog feed events.
   */
  @Sse('events')
  stream(): Observable<MessageEvent> {
    return this.subscribeToBlogFeed.execute().pipe(
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
  async getBlog(
    @Param('blogId', new ParseUUIDPipe({ version: '4' })) blogId: string,
  ): Promise<BlogResponse> {
    const blog = await this.getBlogById.execute(blogId);
    return BlogResponse.fromBlog(blog);
  }
}
