import { Module } from '@nestjs/common';
import { DATABASE_CLIENT, databaseProvider } from './database.provider';
import { DatabaseService } from './database.service';

/**
 * Nest module that wires the database layer into the application's DI graph.
 *
 * Injection flow:
 * - `providers` registers what exists inside this module.
 * - `databaseProvider` creates the raw Postgres client under the
 *   `DATABASE_CLIENT` token.
 * - `DatabaseService` can then inject that token.
 * - `exports` exposes the public injectables of this module to other modules.
 *
 * `DATABASE_CLIENT` is exported rather than `databaseProvider` because other
 * modules inject the token, not the provider definition object.
 */
@Module({
  providers: [databaseProvider, DatabaseService],
  exports: [DATABASE_CLIENT, DatabaseService],
})
export class DatabaseModule {}
