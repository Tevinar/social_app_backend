import { type ListedBlogsSlice } from '../../application/use-cases/list-blogs';

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
 * HTTP response body returned by the cursor-based list-blogs endpoint.
 */
export class ListBlogsResponse {
  items!: ListedBlogResponse[];
  nextCursor?: string;

  /**
   * Builds the HTTP response DTO from the application-layer slice result.
   *
   * @param slice Cursor-based blog result returned by the use case.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromListedBlogsSlice(slice: ListedBlogsSlice): ListBlogsResponse {
    return {
      items: slice.items.map((blog) => ({
        id: blog.id,
        poster: blog.poster,
        title: blog.title,
        content: blog.content,
        imageUrl: blog.imageUrl,
        topics: blog.topics,
      })),
      ...(slice.nextCursor ? { nextCursor: slice.nextCursor } : {}),
    };
  }
}
