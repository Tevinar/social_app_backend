/**
 * Signals that submitted chat-message content does not contain visible text.
 */
export class InvalidChatMessageContentError extends Error {
  /**
   * Creates a stable validation error for rejected chat-message content.
   */
  constructor() {
    super('Chat message content must not be blank');
  }
}

/**
 * Value object representing one chat-message content string.
 */
export class ChatMessageContent {
  /**
   * Creates chat-message content from an already-validated string.
   *
   * Use {@link ChatMessageContent.from} instead of calling the constructor
   * directly.
   *
   * @param value Exact message content stored inside the application.
   */
  private constructor(readonly value: string) {}

  /**
   * Builds chat-message content from raw caller input.
   *
   * Content is preserved exactly as submitted once it passes visible-text
   * validation.
   *
   * @param raw Content submitted by the caller.
   * @returns Validated chat-message content.
   * @throws {InvalidChatMessageContentError} Thrown when the content is blank.
   */
  static from(raw: string): ChatMessageContent {
    if (!/\S/u.test(raw)) {
      throw new InvalidChatMessageContentError();
    }

    return new ChatMessageContent(raw);
  }
}
