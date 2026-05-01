import { type ListedBlogsSlice } from '../../application/use-cases/list-blogs';
import { BlogResponse } from './blog-response';

/**
 * HTTP response body returned by the cursor-based list-blogs endpoint.
 */
export class ListBlogsResponse {
  items!: BlogResponse[];
  nextCursor?: string;

  /**
   * Builds the HTTP response DTO from the application-layer slice result.
   *
   * @param slice Cursor-based blog result returned by the use case.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromListedBlogsSlice(slice: ListedBlogsSlice): ListBlogsResponse {
    return {
      items: slice.items.map((blog) => BlogResponse.fromBlog(blog)),
      ...(slice.nextCursor ? { nextCursor: slice.nextCursor } : {}),
    };
  }
}
