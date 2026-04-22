import { type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import postgres from 'postgres';
import { requireSecretFile } from '../config/require-secret-file';
import { buildDatabaseUrl } from './build-database-url';

/**
 * Runtime key under which Nest stores the shared Postgres.js client.
 *
 * A custom token is needed here because the client is produced by a factory,
 * not by an injectable class that Nest could use as the token automatically.
 */
export const DATABASE_CLIENT = Symbol('DATABASE_CLIENT');

/**
 * TypeScript view of the Postgres.js client returned by the library factory.
 *
 * This is only a compile-time type alias; it does not exist at runtime, which
 * is why Nest resolves the dependency by `DATABASE_CLIENT` instead.
 */
export type DatabaseClient = ReturnType<typeof postgres>;

/**
 * Secret file that stores the PostgreSQL password outside of source control.
 */
const POSTGRES_PASSWORD_SECRET_FILE_NAME = 'postgres_password.txt';

/**
 * Default maximum number of Postgres connections opened by one app instance.
 */
const POSTGRES_MAX_CONNECTIONS = 10;

/**
 * Provider definition object used by Nest to create the shared Postgres.js
 * client.
 *
 * Important distinction:
 * - `databaseProvider` is the registration recipe read by Nest at startup.
 * - `DATABASE_CLIENT` is the public token other classes inject and modules
 *   export.
 */
export const databaseProvider: Provider = {
  // Register the factory result under the `DATABASE_CLIENT` token.
  provide: DATABASE_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): DatabaseClient => {
    const host = configService.getOrThrow<string>('POSTGRES_HOST');
    const port = Number(configService.getOrThrow<string>('POSTGRES_PORT'));
    const database = configService.getOrThrow<string>('POSTGRES_DB');
    const username = configService.getOrThrow<string>('POSTGRES_USER');
    const password = requireSecretFile(POSTGRES_PASSWORD_SECRET_FILE_NAME);

    const url = buildDatabaseUrl({
      host,
      port,
      database,
      username,
      password,
    });

    return postgres(url, {
      max: POSTGRES_MAX_CONNECTIONS,
    });
  },
};
