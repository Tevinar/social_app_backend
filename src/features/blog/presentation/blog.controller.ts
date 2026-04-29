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
  Headers,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBlogUseCase } from '../application/use-cases/create-blog';
import { CreateBlogRequest } from './dto/create-blog-request';
import { CreateBlogResponse } from './dto/create-blog-response';
import { extractBearerToken } from '../../../core/presentation/http/extract-bearer-token';
import { ListBlogsQuery } from './dto/list-blogs-query';
import { ListBlogsResponse } from './dto/list-blogs-response';
import { ListBlogsByPageUseCase } from '../application/use-cases/list-blogs-by-page';

/**
 * HTTP controller exposing blog endpoints.
 *
 * This presentation adapter is responsible for request validation, file
 * extraction, and mapping use-case results into response DTOs.
 */
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
   * @param listBlogsByPage Blog application service for listing blogs by page.
   */
  constructor(
    private readonly createBlog: CreateBlogUseCase,
    private readonly listBlogsByPage: ListBlogsByPageUseCase,
  ) {}

  /**
   * Creates a blog for the authenticated caller.
   *
   * The endpoint accepts multipart form data so text fields and the uploaded
   * image can be submitted in one request.
   *
   * @param body Validated blog creation request body.
   * @param image Uploaded image file extracted from the multipart request.
   * @param authorization Authorization header containing the bearer token.
   * @returns HTTP response DTO containing the created blog data.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() body: CreateBlogRequest,
    @UploadedFile() image: Express.Multer.File | undefined,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<CreateBlogResponse> {
    if (!image?.buffer) {
      throw new BadRequestException('Image file is required');
    }

    const accessToken = extractBearerToken(authorization);

    const blog = await this.createBlog.execute({
      accessToken,
      title: body.title,
      content: body.content,
      imageBuffer: image.buffer,
      topics: body.topics,
    });

    return CreateBlogResponse.fromCreatedBlog(blog);
  }

  /**
   * Returns one page of blogs for the submitted pagination query.
   *
   * @param query Validated pagination query string.
   * @returns HTTP response DTO containing the requested page of blogs.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@Query() query: ListBlogsQuery): Promise<ListBlogsResponse> {
    const page = await this.listBlogsByPage.execute({
      page: query.page,
      pageSize: query.pageSize,
    });

    return ListBlogsResponse.fromPaginatedBlogs(page);
  }
}
