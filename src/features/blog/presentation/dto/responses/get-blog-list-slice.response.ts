import { type BlogListSliceResult } from '../../../application/use-cases/get-blog-list-slice.use-case';
import { GetBlogResponse } from './get-blog.response';

/**
 * HTTP response body returned by the cursor-based blog list endpoint.
 */
export class GetBlogListSliceResponse {
  items!: GetBlogResponse[];
  nextCursor?: string;

  /**
   * Builds the HTTP response DTO from the application-layer slice result.
   *
   * @param slice Cursor-based blog result returned by the use case.
   * @param apiBaseUrl Public API base URL.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromBlogListSlice(
    slice: BlogListSliceResult,
    apiBaseUrl: string,
  ): GetBlogListSliceResponse {
    return {
      items: slice.items.map((blog) =>
        GetBlogResponse.fromBlog(blog, apiBaseUrl),
      ),
      ...(slice.nextCursor ? { nextCursor: slice.nextCursor } : {}),
    };
  }
}
