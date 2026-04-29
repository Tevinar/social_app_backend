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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBlogUseCase } from '../application/use-cases/create-blog';
import { CreateBlogRequest } from './dto/create-blog-request';
import { CreateBlogResponse } from './dto/create-blog-response';

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
   */
  constructor(private readonly createBlog: CreateBlogUseCase) {}

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
}

/**
 * Extracts the raw bearer token value from the Authorization header.
 *
 * @param authorization Authorization header submitted by the caller.
 * @returns Raw access token.
 * @throws {BadRequestException} Thrown when the header is missing or malformed.
 */
function extractBearerToken(authorization: string | undefined): string {
  if (!authorization?.startsWith('Bearer ')) {
    throw new BadRequestException('Missing bearer token');
  }

  return authorization.slice('Bearer '.length);
}
