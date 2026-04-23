/**
 * Minimum number of non-blank characters accepted for public profile names.
 */
export const NAME_MIN_NON_BLANK_CHARACTERS = 3;

/**
 * Validation pattern that requires at least the configured number of
 * non-blank characters anywhere in the submitted name.
 */
export const NAME_MIN_NON_BLANK_CHARACTERS_REGEX = /^(?=(?:.*\S){3,}).+$/u;

/**
 * Signals that a submitted public profile name is too short after blank
 * characters are ignored.
 */
export class InvalidNameError extends Error {
  /**
   * Creates a stable validation error for rejected public profile names.
   */
  constructor() {
    super(
      `Name must contain at least ${NAME_MIN_NON_BLANK_CHARACTERS} non-blank characters`,
    );
  }
}

/**
 * Value object representing a public profile name in normalized auth form.
 */
export class Name {
  /**
   * Creates a name value object from an already-normalized string.
   *
   * Use {@link Name.from} instead of calling the constructor directly.
   *
   * @param value Canonical public profile name used inside the application.
   */
  private constructor(readonly value: string) {}

  /**
   * Builds a public profile name from raw caller input.
   *
   * Surrounding whitespace is trimmed before the minimum non-blank character
   * count is enforced.
   *
   * @param raw Name input received from a caller.
   * @returns A normalized public profile name.
   * @throws {InvalidNameError} Thrown when the input does not contain at least
   * the configured minimum number of non-blank characters.
   */
  static from(raw: string): Name {
    const value = raw.trim();

    if (!NAME_MIN_NON_BLANK_CHARACTERS_REGEX.test(value)) {
      throw new InvalidNameError();
    }

    return new Name(value);
  }
}
