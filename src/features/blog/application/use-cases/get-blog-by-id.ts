import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVariable } from '../../../../core/config/env-variable';
import { UseCase } from '../../../../core/contracts/use-case';
import { BLOG_READER, type BlogReader } from '../ports/blog-reader';
import { BlogReadModel } from '../models/blog.model';
import { BlogNotFoundError } from '../errors/blog-not-found';

/**
 * Application use case responsible for retrieving one blog by id.
 */
@Injectable()
export class GetBlogByIdUseCase implements UseCase<string, BlogReadModel> {
  /**
   * Receives the dependencies required to read one blog and build its public
   * image URL.
   *
   * @param blogReader Reads blog records from persistence.
   * @param configService Reads runtime configuration values.
   */
  constructor(
    @Inject(BLOG_READER)
    private readonly blogReader: BlogReader,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Reads one blog by its stable identifier.
   *
   * @param blogId Stable blog identifier.
   * @returns Public blog representation.
   * @throws {BlogNotFoundError} Thrown when the requested blog does not exist.
   */
  async execute(blogId: string): Promise<BlogReadModel> {
    const blog = await this.blogReader.findById(blogId);

    if (!blog) {
      throw new BlogNotFoundError();
    }

    return {
      id: blog.id,
      poster: blog.poster,
      title: blog.title,
      content: blog.content,
      imageUrl: `${this.configService.getOrThrow<string>(
        EnvVariable.ApiBaseUrl,
      )}${blog.imagePath}`,
      topics: blog.topics,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    };
  }
}
