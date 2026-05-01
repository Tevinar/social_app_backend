import { type BlogCursor } from '../blog-cursor/blog-cursor';

export const BLOG_READER = Symbol('BLOG_READER');

/**
 * Application port used to read recent blog projections.
 */
export interface BlogReader {
  /**
   * Reads one recent slice of blogs ordered from most recent to least recent.
   *
   * @param params Cursor window requested by the caller.
   * @returns Current slice of blogs.
   */
  findRecentSlice(params: FindRecentBlogSliceParams): Promise<RecentBlogsSlice>;

  /**
   * Returns the image record associated with one blog.
   *
   * @param blogId Stable blog identifier.
   * @returns Blog image record when found, otherwise null.
   */
  findImageByBlogId(blogId: string): Promise<BlogImageRecord | null>;
}

export type FindRecentBlogSliceParams = {
  limit: number;
  cursor?: BlogCursor;
};

export type ListedBlogRecord = {
  id: string;
  createdAt: Date;
  poster: {
    id: string;
    name: string;
  };
  title: string;
  content: string;
  imagePath: string;
  topics: string[];
};

export type RecentBlogsSlice = {
  items: ListedBlogRecord[];
};

export type BlogImageRecord = {
  blogId: string;
  imageKey: string;
};
