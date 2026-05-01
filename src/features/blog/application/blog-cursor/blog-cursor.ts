import { MAX_LIMIT, MIN_LIMIT } from './blog-cursor.constants';
import { InvalidBlogCursorError } from './invalid-blog-cursor.error';

export type BlogCursor = {
  createdAt: Date;
  id: string;
};

type EncodedBlogCursor = {
  createdAt: string;
  id: string;
};

/**
 * Immutable blog-specific cursor pagination value object.
 */
export class BlogCursorPagination {
  /**
   * Builds one immutable cursor-pagination window.
   *
   * @param limit Maximum number of blogs to read in the current slice.
   * @param cursor Optional decoded cursor describing the current slice start.
   */
  private constructor(
    readonly limit: number,
    readonly cursor?: BlogCursor,
  ) {}

  /**
   * Validates one cursor-pagination request and decodes its cursor when present.
   *
   * @param limit Maximum number of blogs requested.
   * @param encodedCursor Opaque cursor returned by a previous response.
   * @returns Validated pagination object ready for querying persistence.
   */
  static from(limit: number, encodedCursor?: string): BlogCursorPagination {
    if (!Number.isInteger(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
      throw new InvalidBlogCursorError(
        `Limit must be an integer between ${MIN_LIMIT} and ${MAX_LIMIT}`,
      );
    }

    if (!encodedCursor) {
      return new BlogCursorPagination(limit);
    }

    return new BlogCursorPagination(limit, this.decodeCursor(encodedCursor));
  }

  /**
   * Encodes one cursor payload into the opaque string returned to API clients.
   *
   * @param createdAt Creation timestamp of the last blog in the current slice.
   * @param id Stable identifier of the last blog in the current slice.
   * @returns Base64-encoded cursor token.
   */
  static encodeCursor(createdAt: Date, id: string): string {
    return Buffer.from(
      JSON.stringify({
        createdAt: createdAt.toISOString(),
        id,
      } satisfies EncodedBlogCursor),
    ).toString('base64');
  }

  /**
   * Decodes one opaque cursor token into the typed position used by queries.
   *
   * @param encodedCursor Base64-encoded cursor token supplied by the client.
   * @returns Decoded cursor position.
   * @throws {InvalidBlogCursorError} Thrown when the token cannot be decoded
   *   into a valid blog cursor.
   */
  private static decodeCursor(encodedCursor: string): BlogCursor {
    try {
      const decoded = JSON.parse(
        Buffer.from(encodedCursor, 'base64').toString('utf8'),
      ) as Partial<EncodedBlogCursor>;

      if (
        typeof decoded.createdAt !== 'string' ||
        typeof decoded.id !== 'string' ||
        decoded.id.length === 0
      ) {
        throw new InvalidBlogCursorError('Cursor is malformed');
      }

      const createdAt = new Date(decoded.createdAt);

      if (Number.isNaN(createdAt.getTime())) {
        throw new InvalidBlogCursorError('Cursor is malformed');
      }

      return {
        createdAt,
        id: decoded.id,
      };
    } catch (error) {
      if (error instanceof InvalidBlogCursorError) {
        throw error;
      }

      throw new InvalidBlogCursorError('Cursor is malformed');
    }
  }
}
