import { type Provider } from '@nestjs/common';
import postgres from 'postgres';
import { getDatabaseUrl } from './database.config';

/**
 * Nest dependency-injection token for the shared Postgres.js client.
 */
export const DATABASE_CLIENT = Symbol('DATABASE_CLIENT');

/**
 * Concrete Postgres.js client type returned by the library factory.
 */
export type DatabaseClient = ReturnType<typeof postgres>;

/**
 * Factory-based Nest provider that creates a single shared Postgres.js client
 * for the application.
 */
export const databaseProvider: Provider = {
  provide: DATABASE_CLIENT,
  useFactory: (): DatabaseClient =>
    postgres(getDatabaseUrl(), {
      max: 10,
    }),
};
