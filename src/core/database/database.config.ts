import { requireEnv } from '../config/require-env';
import { requireSecretFile } from '../config/require-secret-file';

/**
 * Database password loaded from the local secrets directory instead of source
 * control.
 */
const password = requireSecretFile('postgres_password.txt');

/**
 * Normalized runtime settings used to connect the application to PostgreSQL.
 *
 * This file is responsible only for collecting and shaping configuration
 * values. It does not create the database client itself; that happens in
 * `database.provider.ts`.
 */
export const databaseConfig = {
  host: requireEnv('POSTGRES_HOST'),
  port: Number(requireEnv('POSTGRES_PORT')),
  database: requireEnv('POSTGRES_DB'),
  username: requireEnv('POSTGRES_USER'),
  password,
} as const;

/**
 * Builds the PostgreSQL connection string consumed by the database provider.
 *
 * Centralizing URL construction here keeps the provider focused on Nest DI and
 * client creation rather than configuration assembly.
 *
 * @returns A PostgreSQL connection string ready to be passed to Postgres.js.
 */
export function getDatabaseUrl(): string {
  return `postgresql://${databaseConfig.username}:${encodeURIComponent(databaseConfig.password)}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`;
}
