export const BLOG_READER = Symbol('BLOG_READER');

/**
 * Application port used to read paginated blog projections.
 */
export interface BlogReader {
  /**
   * Reads one page of blogs ordered from most recent to least recent.
   *
   * @param params Pagination window requested by the caller.
   * @returns Current page of blogs together with the total row count.
   */
  findRecentPage(params: FindRecentBlogPageParams): Promise<RecentBlogsPage>;

  /**
   * Returns the image record associated with one blog.
   *
   * @param blogId Stable blog identifier.
   * @returns Blog image record when found, otherwise null.
   */
  findImageByBlogId(blogId: string): Promise<BlogImageRecord | null>;
}

export type FindRecentBlogPageParams = {
  limit: number;
  offset: number;
};

export type ListedBlogRecord = {
  id: string;
  poster: {
    id: string;
    name: string;
  };
  title: string;
  content: string;
  imagePath: string;
  topics: string[];
};

export type RecentBlogsPage = {
  items: ListedBlogRecord[];
  totalCount: number;
};

export type BlogImageRecord = {
  blogId: string;
  imageKey: string;
};
