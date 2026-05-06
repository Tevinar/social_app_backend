import { Blog } from '../../domain/entities/blog';

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
  create(params: CreateBlogRecordParams): Promise<Blog>;
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
 * Stable blog creation result names.
 */
export enum CreateBlogRecordResult {
  CREATED = 'created',
  POSTER_NOT_FOUND = 'poster_not_found',
}
