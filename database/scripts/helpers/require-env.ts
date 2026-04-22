/**
 * Reads one required environment variable and fails fast when it is missing.
 *
 * Centralizing this helper keeps raw `process.env` access localized while
 * allowing feature and infrastructure code to share the same behavior.
 *
 * @param name Name of the environment variable to read.
 * @returns The resolved environment variable value.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
