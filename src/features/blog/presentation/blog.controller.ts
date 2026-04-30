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
} from '@nestjs/common';
import { type Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBlogUseCase } from '../application/use-cases/create-blog';
import { CreateBlogRequest } from './dto/create-blog-request';
import { CreateBlogResponse } from './dto/create-blog-response';
import { ListBlogsQuery } from './dto/list-blogs-query';
import { ListBlogsResponse } from './dto/list-blogs-response';
import { ListBlogsByPageUseCase } from '../application/use-cases/list-blogs-by-page';
import { GetBlogImageUseCase } from '../application/use-cases/get-blog-image-use-case';
import { AccessTokenGuard } from '../../auth/presentation/guards/access-tokens';
import { AuthenticatedUser } from '../../auth/presentation/decorators/authenticated-user';

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
   * @param listBlogsByPage Blog application service for listing blogs by page.
   * @param getBlogImage Blog application service for resolving blog image redirects.
   */
  constructor(
    private readonly createBlog: CreateBlogUseCase,
    private readonly listBlogsByPage: ListBlogsByPageUseCase,
    private readonly getBlogImage: GetBlogImageUseCase,
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
  ): Promise<CreateBlogResponse> {
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
}
