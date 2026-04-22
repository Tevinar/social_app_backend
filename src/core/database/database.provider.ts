import { type Provider } from '@nestjs/common';
import postgres from 'postgres';
import { getDatabaseUrl } from './database.config';

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
  useFactory: (): DatabaseClient =>
    postgres(getDatabaseUrl(), {
      max: 10,
    }),
};
