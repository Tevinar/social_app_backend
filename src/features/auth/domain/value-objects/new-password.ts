/**
 * Minimum plaintext length accepted for newly chosen passwords.
 */
export const NEW_PASSWORD_MIN_LENGTH = 6;

/**
 * Signals that a submitted new password does not satisfy sign-up policy.
 */
export class InvalidNewPasswordError extends Error {
  /**
   * Creates a stable validation error for rejected new passwords.
   */
  constructor() {
    super(
      `Password must be at least ${NEW_PASSWORD_MIN_LENGTH} characters long`,
    );
  }
}

/**
 * Value object representing a plaintext password being chosen for a new
 * account or password-reset flow.
 *
 * The value is intentionally not normalized: whitespace and casing are part of
 * the user's chosen secret and must be preserved exactly.
 */
export class NewPassword {
  /**
   * Creates a new-password value object from an already-validated plaintext
   * password.
   *
   * Use {@link NewPassword.from} instead of calling the constructor directly.
   *
   * @param value Plaintext password to preserve exactly as submitted.
   */
  private constructor(readonly value: string) {}

  /**
   * Builds a new-password value object from raw caller input.
   *
   * @param raw Plaintext password submitted by the caller.
   * @returns A validated new-password value object.
   * @throws {InvalidNewPasswordError} Thrown when the password is shorter than
   * the configured minimum length.
   */
  static from(raw: string): NewPassword {
    if (raw.length < NEW_PASSWORD_MIN_LENGTH) {
      throw new InvalidNewPasswordError();
    }

    return new NewPassword(raw);
  }
}
