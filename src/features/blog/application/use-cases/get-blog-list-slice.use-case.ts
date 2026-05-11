import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { BLOG_READER, type BlogReader } from '../ports/blog-reader.port';
import { BlogCursorPagination } from '../pagination/blog.cursor';
import { Blog } from '../../domain/entities/blog';

/**
 * Application use case responsible for listing recent blog slices.
 */
@Injectable()
export class GetBlogListSliceUseCase implements UseCase<
  BlogListSliceParams,
  BlogListSliceResult
> {
  /**
   * Receives the capabilities required to read blog slices.
   *
   * @param blogReader Reads recent blog records from persistence.
   */
  constructor(
    @Inject(BLOG_READER)
    private readonly blogReader: BlogReader,
  ) {}

  /**
   * Returns one cursor-based slice of blogs ordered by recency.
   *
   * @param params Requested cursor and slice size.
   * @returns Blog slice data ready for presentation.
   */
  async execute(params: BlogListSliceParams): Promise<BlogListSliceResult> {
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
      items: result.items,
      ...(nextCursor ? { nextCursor } : {}),
    };
  }
}

export type BlogListSliceParams = {
  limit: number;
  cursor?: string;
};

export type BlogListSliceResult = {
  items: Blog[];
  nextCursor?: string;
};
