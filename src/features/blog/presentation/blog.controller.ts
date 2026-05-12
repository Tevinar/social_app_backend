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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { EnvVariable } from '../../../core/config/env-variable';
import { CreateBlogUseCase } from '../application/use-cases/create-blog.use-case';
import { CreateBlogRequest } from './dto/requests/create-blog.request';
import { GetBlogImageUseCase } from '../application/use-cases/get-blog-image.use-case';
import { GetBlogByIdUseCase } from '../application/use-cases/get-blog-by-id.use-case';
import { GetBlogListSliceRequest } from './dto/requests/get-blog-list-slice.request';
import { GetBlogResponse } from './dto/responses/get-blog.response';
import { GetBlogListSliceResponse } from './dto/responses/get-blog-list-slice.response';
import { GetBlogListSliceUseCase } from '../application/use-cases/get-blog-list-slice.use-case';
import { AccessTokenGuard } from '../../../app/auth/guards/access-tokens';
import { AuthenticatedUser } from '../../../app/auth/decorators/authenticated-user';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';

/**
 * HTTP controller exposing blog endpoints.
 *
 * This presentation adapter is responsible for request validation, file
 * extraction, and mapping use-case results into response DTOs.
 */
@ApiBearerAuth()
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
   * @param getBlogListSliceUseCase Blog application service for listing blog slices.
   * @param getBlogImageUseCase Blog application service for resolving blog image redirects.
   * @param getBlogByIdUseCase Blog application service for retrieving one blog by id.
   * @param configService Reads runtime configuration values.
   */
  constructor(
    private readonly createBlogUseCase: CreateBlogUseCase,
    private readonly getBlogListSliceUseCase: GetBlogListSliceUseCase,
    private readonly getBlogImageUseCase: GetBlogImageUseCase,
    private readonly getBlogByIdUseCase: GetBlogByIdUseCase,
    private readonly configService: ConfigService,
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'content', 'topics', 'image'],
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        topics: {
          type: 'array',
          items: { type: 'string' },
        },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
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

    return GetBlogResponse.fromBlog(blog, this.apiBaseUrl);
  }

  /**
   * Returns one cursor-based slice of blogs for the submitted query.
   *
   * @param query Validated cursor-pagination query string.
   * @returns HTTP response DTO containing the requested blog slice.
   */
  @Get()
  async getBlogListSlice(
    @Query() query: GetBlogListSliceRequest,
  ): Promise<GetBlogListSliceResponse> {
    const slice = await this.getBlogListSliceUseCase.execute({
      limit: query.limit,
      ...(query.cursor ? { cursor: query.cursor } : {}),
    });

    return GetBlogListSliceResponse.fromBlogListSlice(slice, this.apiBaseUrl);
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
    return GetBlogResponse.fromBlog(blog, this.apiBaseUrl);
  }

  /**
   * Returns the public API base URL used to build absolute blog image URLs.
   *
   * @returns Public API base URL.
   */
  private get apiBaseUrl(): string {
    return this.configService.getOrThrow<string>(EnvVariable.ApiBaseUrl);
  }
}
