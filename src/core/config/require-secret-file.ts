import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reads one required secret file from the local `.secrets` directory and fails
 * fast when it is missing.
 *
 * @param name Basename of the secret file to read from `.secrets/`.
 * @returns The trimmed secret file contents.
 */
export function requireSecretFile(name: string): string {
  try {
    return readFileSync(join(process.cwd(), '.secrets', name), 'utf8').trim();
  } catch {
    throw new Error(`Missing required secret file: .secrets/${name}`);
  }
}
