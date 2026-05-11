/**
 * Value object representing blog content.
 */
export class BlogContent {
  /**
   * Creates blog content from an already-validated string.
   *
   * Use {@link BlogContent.from} instead of calling the constructor directly.
   *
   * @param value Exact blog content stored inside the application.
   */
  private constructor(readonly value: string) {}

  /**
   * Builds blog content from raw caller input.
   *
   * Content is preserved exactly as submitted once it passes the visible-text
   * validation.
   *
   * @param raw Content submitted by the caller.
   * @returns Validated blog content.
   * @throws {InvalidBlogContentError} Thrown when the content is blank.
   */
  static from(raw: string): BlogContent {
    // Reject blank content
    if (!/\S/u.test(raw)) {
      throw new InvalidBlogContentError();
    }

    return new BlogContent(raw);
  }
}

/**
 * Signals that submitted blog content does not contain visible text.
 */
export class InvalidBlogContentError extends Error {
  /**
   * Creates a stable validation error for rejected blog content.
   */
  constructor() {
    super('Blog content must not be blank');
  }
}
