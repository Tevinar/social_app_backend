export const MIN_LIMIT = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export type ChatListCursor = {
  lastMessageAt: Date;
  id: string;
};

type EncodedChatListCursor = {
  lastMessageAt: string;
  id: string;
};

/**
 * Signals that submitted chat-list cursor values cannot be accepted.
 */
export class InvalidChatListCursorError extends Error {}

/**
 * Immutable chat-list cursor-pagination value object.
 */
export class ChatListCursorPagination {
  /**
   * Builds one immutable cursor-pagination window.
   *
   * @param limit Maximum number of chats to read in the current slice.
   * @param cursor Optional decoded cursor describing the current slice start.
   */
  private constructor(
    readonly limit: number,
    readonly cursor?: ChatListCursor,
  ) {}

  /**
   * Validates one cursor-pagination request and decodes its cursor when present.
   *
   * @param limit Maximum number of chats requested.
   * @param encodedCursor Opaque cursor returned by a previous response.
   * @returns Validated pagination object ready for querying persistence.
   */
  static from(limit: number, encodedCursor?: string): ChatListCursorPagination {
    if (!Number.isInteger(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
      throw new InvalidChatListCursorError(
        `Limit must be an integer between ${MIN_LIMIT} and ${MAX_LIMIT}`,
      );
    }

    if (!encodedCursor) {
      return new ChatListCursorPagination(limit);
    }

    return new ChatListCursorPagination(
      limit,
      this.decodeCursor(encodedCursor),
    );
  }

  /**
   * Encodes one cursor payload into the opaque string returned to API clients.
   *
   * @param lastMessageAt Activity timestamp of the last chat in the slice.
   * @param id Stable identifier of the last chat in the slice.
   * @returns Base64-encoded cursor token.
   */
  static encodeCursor(lastMessageAt: Date, id: string): string {
    return Buffer.from(
      JSON.stringify({
        lastMessageAt: lastMessageAt.toISOString(),
        id,
      } satisfies EncodedChatListCursor),
    ).toString('base64');
  }

  /**
   * Decodes one opaque cursor token into the typed position used by queries.
   *
   * @param encodedCursor Base64-encoded cursor token supplied by the client.
   * @returns Decoded cursor position.
   * @throws {InvalidChatListCursorError} Thrown when the token cannot be
   * decoded into a valid chat-list cursor.
   */
  private static decodeCursor(encodedCursor: string): ChatListCursor {
    try {
      const decoded = JSON.parse(
        Buffer.from(encodedCursor, 'base64').toString('utf8'),
      ) as Partial<EncodedChatListCursor>;

      if (
        typeof decoded.lastMessageAt !== 'string' ||
        typeof decoded.id !== 'string' ||
        decoded.id.length === 0
      ) {
        throw new InvalidChatListCursorError('Cursor is malformed');
      }

      const lastMessageAt = new Date(decoded.lastMessageAt);

      if (Number.isNaN(lastMessageAt.getTime())) {
        throw new InvalidChatListCursorError('Cursor is malformed');
      }

      return {
        lastMessageAt,
        id: decoded.id,
      };
    } catch (error) {
      if (error instanceof InvalidChatListCursorError) {
        throw error;
      }

      throw new InvalidChatListCursorError('Cursor is malformed');
    }
  }
}
