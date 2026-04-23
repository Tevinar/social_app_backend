import { isEmail } from 'class-validator';

/**
 * Signals that a submitted email address is malformed.
 */
export class InvalidEmailError extends Error {
  /**
   * Creates a stable validation error for malformed email addresses.
   */
  constructor() {
    super('Invalid email');
  }
}

/**
 * Value object representing an email address in its normalized auth form.
 */
export class Email {
  /**
   * Creates an email value object from an already-normalized string.
   *
   * Use {@link Email.from} instead of calling the constructor directly.
   *
   * @param value Canonical email value used inside the application.
   */
  private constructor(readonly value: string) {}

  /**
   * Builds an email value object from raw user input.
   *
   * The input is normalized by trimming surrounding whitespace and converting
   * the address to lowercase before the email format is enforced.
   *
   * @param raw Email input received from a caller.
   * @returns A normalized email value object.
   * @throws {InvalidEmailError} Thrown when the input is not a valid email
   * address.
   */
  static from(raw: string): Email {
    const value = raw.trim().toLowerCase();

    if (!isEmail(value)) {
      throw new InvalidEmailError();
    }

    return new Email(value);
  }
}
