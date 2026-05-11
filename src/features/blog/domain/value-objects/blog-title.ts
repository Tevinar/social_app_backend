/**
 * Value object representing a blog title in normalized form.
 */
export class BlogTitle {
  /**
   * Creates a blog title from an already-normalized string.
   *
   * Use {@link BlogTitle.from} instead of calling the constructor directly.
   *
   * @param value Canonical blog title used inside the application.
   */
  private constructor(readonly value: string) {}

  /**
   * Builds a blog title from raw caller input.
   *
   * Surrounding whitespace is trimmed before the title is validated.
   *
   * @param raw Title submitted by the caller.
   * @returns A normalized blog title.
   * @throws {InvalidBlogTitleError} Thrown when the title is blank.
   */
  static from(raw: string): BlogTitle {
    const value = raw.trim();

    // Reject blank titles
    if (!/\S/u.test(value)) {
      throw new InvalidBlogTitleError();
    }

    return new BlogTitle(value);
  }
}

/**
 * Signals that a submitted blog title does not contain visible text.
 */
export class InvalidBlogTitleError extends Error {
  /**
   * Creates a stable validation error for rejected blog titles.
   */
  constructor() {
    super('Blog title must not be blank');
  }
}
