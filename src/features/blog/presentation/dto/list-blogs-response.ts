import { type PaginatedBlogs } from '../../application/use-cases/list-blogs-by-page';

/**
 * One blog item returned by the list-blogs endpoint.
 */
class ListedBlogResponse {
  id!: string;
  poster!: {
    id: string;
    name: string;
  };
  title!: string;
  content!: string;
  imageUrl!: string;
  topics!: string[];
}

/**
 * HTTP response body returned by the paginated list-blogs endpoint.
 */
export class ListBlogsResponse {
  items!: ListedBlogResponse[];
  page!: number;
  pageSize!: number;
  totalCount!: number;
  totalPages!: number;

  /**
   * Builds the HTTP response DTO from the application-layer page result.
   *
   * @param page Paginated blog result returned by the use case.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromPaginatedBlogs(page: PaginatedBlogs): ListBlogsResponse {
    return {
      items: page.items.map((blog) => ({
        id: blog.id,
        poster: blog.poster,
        title: blog.title,
        content: blog.content,
        imageUrl: blog.imageUrl,
        topics: blog.topics,
      })),
      page: page.page,
      pageSize: page.pageSize,
      totalCount: page.totalCount,
      totalPages: page.totalPages,
    };
  }
}
