import { MAX_LIMIT, MIN_LIMIT } from './chat-candidate-cursor.constants';
import { InvalidChatCandidateCursorError } from './invalid-chat-candidate-cursor.error';

export type ChatCandidateCursor = {
  createdAt: Date;
  id: string;
};

type EncodedChatCandidateCursor = {
  createdAt: string;
  id: string;
};

/**
 * Immutable chat-candidate cursor-pagination value object.
 */
export class ChatCandidateCursorPagination {
  /**
   * Builds one immutable cursor-pagination window.
   *
   * @param limit Maximum number of candidates to read in the current slice.
   * @param cursor Optional decoded cursor describing the current slice start.
   */
  private constructor(
    readonly limit: number,
    readonly cursor?: ChatCandidateCursor,
  ) {}

  /**
   * Validates one cursor-pagination request and decodes its cursor when present.
   *
   * @param limit Maximum number of candidates requested.
   * @param encodedCursor Opaque cursor returned by a previous response.
   * @returns Validated pagination object ready for querying persistence.
   */
  static from(
    limit: number,
    encodedCursor?: string,
  ): ChatCandidateCursorPagination {
    if (!Number.isInteger(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
      throw new InvalidChatCandidateCursorError(
        `Limit must be an integer between ${MIN_LIMIT} and ${MAX_LIMIT}`,
      );
    }

    if (!encodedCursor) {
      return new ChatCandidateCursorPagination(limit);
    }

    return new ChatCandidateCursorPagination(
      limit,
      this.decodeCursor(encodedCursor),
    );
  }

  /**
   * Encodes one cursor payload into the opaque string returned to API clients.
   *
   * @param createdAt Creation timestamp of the last candidate in the slice.
   * @param id Stable identifier of the last candidate in the slice.
   * @returns Base64-encoded cursor token.
   */
  static encodeCursor(createdAt: Date, id: string): string {
    return Buffer.from(
      JSON.stringify({
        createdAt: createdAt.toISOString(),
        id,
      } satisfies EncodedChatCandidateCursor),
    ).toString('base64');
  }

  /**
   * Decodes one opaque cursor token into the typed position used by queries.
   *
   * @param encodedCursor Base64-encoded cursor token supplied by the client.
   * @returns Decoded cursor position.
   * @throws {InvalidChatCandidateCursorError} Thrown when the token cannot be
   * decoded into a valid candidate cursor.
   */
  private static decodeCursor(encodedCursor: string): ChatCandidateCursor {
    try {
      const decoded = JSON.parse(
        Buffer.from(encodedCursor, 'base64').toString('utf8'),
      ) as Partial<EncodedChatCandidateCursor>;

      if (
        typeof decoded.createdAt !== 'string' ||
        typeof decoded.id !== 'string' ||
        decoded.id.length === 0
      ) {
        throw new InvalidChatCandidateCursorError('Cursor is malformed');
      }

      const createdAt = new Date(decoded.createdAt);

      if (Number.isNaN(createdAt.getTime())) {
        throw new InvalidChatCandidateCursorError('Cursor is malformed');
      }

      return {
        createdAt,
        id: decoded.id,
      };
    } catch (error) {
      if (error instanceof InvalidChatCandidateCursorError) {
        throw error;
      }

      throw new InvalidChatCandidateCursorError('Cursor is malformed');
    }
  }
}
