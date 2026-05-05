import { type BlogCursor } from '../blog-cursor/blog-cursor';
import { BlogRecord } from '../models/blog.model';

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

  /**
   * Reads one blog by its stable identifier.
   *
   * @param blogId Stable blog identifier.
   * @returns Blog record when found, otherwise null.
   */
  findById(blogId: string): Promise<BlogRecord | null>;
}

export type FindRecentBlogSliceParams = {
  limit: number;
  cursor?: BlogCursor;
};

export type RecentBlogsSlice = {
  items: BlogRecord[];
};

export type BlogImageRecord = {
  blogId: string;
  imageKey: string;
};
