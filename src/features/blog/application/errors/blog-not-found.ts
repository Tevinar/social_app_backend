/**
 * Signals that the requested blog does not exist.
 */
export class BlogNotFoundError extends Error {
  /**
   * Creates a stable not-found error for missing blogs.
   */
  constructor() {
    super('Blog not found');
  }
}
