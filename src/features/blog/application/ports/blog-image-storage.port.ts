import { BlogImage } from '../../domain/value-objects/blog-image';

export const BLOG_IMAGE_STORAGE = Symbol('BLOG_IMAGE_STORAGE');

/**
 * Application port used to store and remove blog image objects.
 */
export interface BlogImageStorage {
  /**
   * Saves a blog image and returns the storage key that should be persisted
   * with the blog record.
   *
   * @param params Image data and owning blog identifier.
   * @returns Stored image key.
   */
  save(params: SaveBlogImageParams): Promise<string>;

  /**
   * Removes a previously stored blog image.
   *
   * @param key Storage object key to delete.
   */
  delete(key: string): Promise<void>;
}

/**
 * Data required to store a blog image.
 */
export type SaveBlogImageParams = {
  blogId: string;
  image: BlogImage;
};
