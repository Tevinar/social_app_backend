import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { BLOG_READER, type BlogReader } from '../ports/blog-reader.port';
import { Blog } from '../../domain/entities/blog';
import { BlogNotFoundError } from '../errors/blog-not-found';

/**
 * Application use case responsible for retrieving one blog by id.
 */
@Injectable()
export class GetBlogByIdUseCase implements UseCase<string, Blog> {
  /**
   * Receives the dependencies required to read one blog.
   *
   * @param blogReader Reads blog records from persistence.
   */
  constructor(
    @Inject(BLOG_READER)
    private readonly blogReader: BlogReader,
  ) {}

  /**
   * Reads one blog by its stable identifier.
   *
   * @param blogId Stable blog identifier.
   * @returns Blog entity.
   * @throws {BlogNotFoundError} Thrown when the requested blog does not exist.
   */
  async execute(blogId: string): Promise<Blog> {
    const blog = await this.blogReader.findById(blogId);

    if (!blog) {
      throw new BlogNotFoundError();
    }

    return blog;
  }
}
