const BLOG_TOPICS = new Set([
  'technology',
  'business',
  'programming',
  'entertainment',
]);

/**
 * Value object representing a normalized blog topic.
 */
export class BlogTopic {
  /**
   * Creates a blog topic from an already-normalized string.
   *
   * Use {@link BlogTopic.from} instead of calling the constructor directly.
   *
   * @param value Canonical topic value used inside the application.
   */
  private constructor(readonly value: string) {}

  /**
   * Builds a blog topic from raw caller input.
   *
   * Surrounding whitespace is trimmed before the topic is validated.
   *
   * @param rawValue Topic submitted by the caller.
   * @returns A normalized blog topic.
   * @throws {InvalidBlogTopicError} Thrown when the topic is blank.
   */
  static from(rawValue: string): BlogTopic {
    if (!BLOG_TOPICS.has(rawValue)) {
      throw new InvalidBlogTopicError();
    }

    return new BlogTopic(rawValue);
  }
}

/**
 * Signals that one submitted blog topic is blank.
 */
export class InvalidBlogTopicError extends Error {
  /**
   * Creates a stable validation error for rejected blog topics.
   */
  constructor() {
    super('Blog topics must not contain blank values');
  }
}
