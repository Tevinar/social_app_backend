/**
 * Immutable chat-message cursor-pagination value object.
 */
export class ChatMessageListCursorPagination {
  /**
   * Builds one immutable cursor-pagination window.
   *
   * @param limit Maximum number of chat messages to read in the current slice.
   * @param cursor Optional decoded cursor describing the current slice start.
   */
  private constructor(
    readonly limit: number,
    readonly cursor?: ChatMessageCursor,
  ) {}

  /**
   * Validates one cursor-pagination request and decodes its cursor when
   * present.
   *
   * @param limit Maximum number of chat messages requested.
   * @param encodedCursor Opaque cursor returned by a previous response.
   * @returns Validated pagination object ready for querying persistence.
   */
  static from(
    limit: number,
    encodedCursor?: string,
  ): ChatMessageListCursorPagination {
    if (!Number.isInteger(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
      throw new InvalidChatMessageCursorError(
        `Limit must be an integer between ${MIN_LIMIT} and ${MAX_LIMIT}`,
      );
    }

    if (!encodedCursor) {
      return new ChatMessageListCursorPagination(limit);
    }

    return new ChatMessageListCursorPagination(
      limit,
      this.decodeCursor(encodedCursor),
    );
  }

  /**
   * Encodes one cursor payload into the opaque string returned to API clients.
   *
   * @param createdAt Creation timestamp of the last message in the slice.
   * @param id Stable identifier of the last message in the slice.
   * @returns Base64-encoded cursor token.
   */
  static encodeCursor(createdAt: Date, id: string): string {
    return Buffer.from(
      JSON.stringify({
        createdAt: createdAt.toISOString(),
        id,
      } satisfies EncodedChatMessageCursor),
    ).toString('base64');
  }

  /**
   * Decodes one opaque cursor token into the typed position used by queries.
   *
   * @param encodedCursor Base64-encoded cursor token supplied by the client.
   * @returns Decoded cursor position.
   * @throws {InvalidChatMessageCursorError} Thrown when the token cannot be
   * decoded into a valid chat-message cursor.
   */
  private static decodeCursor(encodedCursor: string): ChatMessageCursor {
    try {
      const decoded = JSON.parse(
        Buffer.from(encodedCursor, 'base64').toString('utf8'),
      ) as Partial<EncodedChatMessageCursor>;

      if (
        typeof decoded.createdAt !== 'string' ||
        typeof decoded.id !== 'string' ||
        decoded.id.length === 0
      ) {
        throw new InvalidChatMessageCursorError('Cursor is malformed');
      }

      const createdAt = new Date(decoded.createdAt);

      if (Number.isNaN(createdAt.getTime())) {
        throw new InvalidChatMessageCursorError('Cursor is malformed');
      }

      return {
        createdAt,
        id: decoded.id,
      };
    } catch (error) {
      if (error instanceof InvalidChatMessageCursorError) {
        throw error;
      }

      throw new InvalidChatMessageCursorError('Cursor is malformed');
    }
  }
}

export const MIN_LIMIT = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export type ChatMessageCursor = {
  createdAt: Date;
  id: string;
};

type EncodedChatMessageCursor = {
  createdAt: string;
  id: string;
};

/**
 * Signals that submitted chat-message cursor values cannot be accepted.
 */
export class InvalidChatMessageCursorError extends Error {}
