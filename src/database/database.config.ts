import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reads a required environment variable and fails fast when it is missing.
 *
 * @param name Name of the environment variable to read.
 * @returns The resolved environment variable value.
 */
function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Database password kept outside versioned config and loaded from the local
 * secrets directory.
 */
const password = readFileSync(
  join(process.cwd(), '.secrets/postgres_password.txt'),
  'utf8',
).trim();

/**
 * Runtime database configuration used to connect the Nest application to
 * PostgreSQL.
 */
export const databaseConfig = {
  host: requireEnv('POSTGRES_HOST'),
  port: Number(requireEnv('POSTGRES_PORT')),
  database: requireEnv('POSTGRES_DB'),
  username: requireEnv('POSTGRES_USER'),
  password,
} as const;

/**
 * Builds a PostgreSQL connection URL from the current database configuration.
 *
 * @returns A PostgreSQL connection string ready to be passed to Postgres.js.
 */
export function getDatabaseUrl(): string {
  return `postgresql://${databaseConfig.username}:${encodeURIComponent(databaseConfig.password)}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`;
}
