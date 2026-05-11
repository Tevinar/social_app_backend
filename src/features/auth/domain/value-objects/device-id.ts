/**
 * Signals that a submitted device identifier is not a valid app-scoped UUID.
 */
export class InvalidDeviceIdError extends Error {
  /**
   * Creates a stable validation error for malformed device identifiers.
   */
  constructor() {
    super('Invalid device id');
  }
}

/**
 * UUID v4 format used by client-generated app installation identifiers.
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

/**
 * Value object representing a client-generated app installation identifier.
 */
export class DeviceId {
  /**
   * Creates a device identifier from an already-normalized UUID string.
   *
   * Use {@link DeviceId.from} instead of calling the constructor directly.
   *
   * @param value Canonical UUID value used inside the application.
   */
  private constructor(readonly value: string) {}

  /**
   * Builds a device identifier from raw client input.
   *
   * The identifier is normalized by trimming surrounding whitespace and
   * lowercasing before the UUID v4 format is enforced.
   *
   * @param raw Device identifier submitted by the client.
   * @returns A normalized device identifier.
   * @throws {InvalidDeviceIdError} Thrown when the input is not a UUID v4.
   */
  static from(raw: string): DeviceId {
    const value = raw.trim().toLowerCase();

    if (!UUID_V4_REGEX.test(value)) {
      throw new InvalidDeviceIdError();
    }

    return new DeviceId(value);
  }
}
