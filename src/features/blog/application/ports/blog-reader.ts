export const BLOG_READER = Symbol('BLOG_READER');

/**
 * Application port used to read paginated blog projections.
 */
export interface BlogReader {
  findRecentPage(params: FindRecentBlogPageParams): Promise<RecentBlogsPage>;
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
