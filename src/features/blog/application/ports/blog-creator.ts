export const BLOG_CREATOR = Symbol('BLOG_CREATOR');

/**
 * Application port used to persist blog records.
 */
export interface BlogCreator {
  /**
   * Persists a newly created blog record.
   *
   * @param params Blog data to store.
   * @returns The outcome of the creation attempt.
   */
  create(params: CreateBlogRecordParams): Promise<CreatedBlog>;
}

/**
 * Data required to create a blog record.
 */
export type CreateBlogRecordParams = {
  id: string;
  posterId: string;
  title: string;
  content: string;
  imageKey: string;
  topics: string[];
};

/**
 * Successful blog projection returned after creation.
 */
export type CreatedBlog = {
  id: string;
  posterId: string;
  title: string;
  content: string;
  imageKey: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Stable blog creation result names.
 */
export enum CreateBlogRecordResult {
  CREATED = 'created',
  POSTER_NOT_FOUND = 'poster_not_found',
}
