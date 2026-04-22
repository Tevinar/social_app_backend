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
   * the address to lowercase before the instance is created.
   *
   * @param raw Email input received from a caller.
   * @returns A normalized email value object.
   */
  static from(raw: string): Email {
    return new Email(raw.trim().toLowerCase());
  }
}
