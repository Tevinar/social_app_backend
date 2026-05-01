import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { BLOG_READER, type BlogReader } from '../ports/blog-reader';
import { EnvVariable } from '../../../../core/config/env-variable';
import { ConfigService } from '@nestjs/config';
import { BlogCursorPagination } from '../blog-cursor/blog-cursor';

/**
 * Application use case responsible for listing recent blog slices.
 */
@Injectable()
export class ListBlogsUseCase implements UseCase<
  ListBlogsParams,
  ListedBlogsSlice
> {
  /**
   * Receives the capabilities required to read blog slices and build public
   * image URLs.
   *
   * @param blogReader Reads recent blog records from persistence.
   * @param configService Reads runtime configuration values.
   */
  constructor(
    @Inject(BLOG_READER)
    private readonly blogReader: BlogReader,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Returns one cursor-based slice of blogs ordered by recency.
   *
   * @param params Requested cursor and slice size.
   * @returns Blog slice data ready for presentation.
   */
  async execute(params: ListBlogsParams): Promise<ListedBlogsSlice> {
    const pagination = BlogCursorPagination.from(params.limit, params.cursor);

    const result = await this.blogReader.findRecentSlice({
      limit: pagination.limit,
      ...(pagination.cursor ? { cursor: pagination.cursor } : {}),
    });

    const lastItem = result.items.at(-1);
    const nextCursor = lastItem
      ? BlogCursorPagination.encodeCursor(lastItem.createdAt, lastItem.id)
      : undefined;

    return {
      items: result.items.map((blogRecord) => ({
        id: blogRecord.id,
        poster: {
          id: blogRecord.poster.id,
          name: blogRecord.poster.name,
        },
        title: blogRecord.title,
        content: blogRecord.content,
        imageUrl: `${this.configService.getOrThrow<string>(
          EnvVariable.ApiBaseUrl,
        )}${blogRecord.imagePath}`,
        topics: blogRecord.topics,
      })),
      ...(nextCursor ? { nextCursor } : {}),
    };
  }
}

export type ListBlogsParams = {
  limit: number;
  cursor?: string;
};

export type ListedBlog = {
  id: string;
  poster: {
    id: string;
    name: string;
  };
  title: string;
  content: string;
  imageUrl: string;
  topics: string[];
};

export type ListedBlogsSlice = {
  items: ListedBlog[];
  nextCursor?: string;
};
