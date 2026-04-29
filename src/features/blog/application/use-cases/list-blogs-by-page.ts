import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import { BLOG_READER, type BlogReader } from '../ports/blog-reader';
import { EnvVariable } from '../../../../core/config/env-variable';
import { ConfigService } from '@nestjs/config';
import { Pagination } from '../../../../core/pagination/pagination';

/**
 * Application use case responsible for listing blog posts by page.
 */
@Injectable()
export class ListBlogsByPageUseCase implements UseCase<
  ListBlogsByPageParams,
  PaginatedBlogs
> {
  /**
   * Receives the capabilities required to read blog pages and build public
   * image URLs.
   *
   * @param blogReader Reads paginated blog records from persistence.
   * @param configService Reads runtime configuration values.
   */
  constructor(
    @Inject(BLOG_READER)
    private readonly blogReader: BlogReader,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Returns one page of blogs ordered by recency.
   *
   * @param params Requested page number and page size.
   * @returns Paginated blog data ready for presentation.
   */
  async execute(params: ListBlogsByPageParams): Promise<PaginatedBlogs> {
    const pagination = Pagination.from(params.page, params.pageSize);

    const result = await this.blogReader.findRecentPage({
      limit: pagination.pageSize,
      offset: pagination.offset,
    });

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
      page: params.page,
      pageSize: params.pageSize,
      totalCount: result.totalCount,
      totalPages: Math.ceil(result.totalCount / params.pageSize),
    };
  }
}

export type ListBlogsByPageParams = {
  page: number;
  pageSize: number;
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

export type PaginatedBlogs = {
  items: ListedBlog[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};
