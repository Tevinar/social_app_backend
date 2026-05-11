import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { DATABASE_CLIENT, type DatabaseClient } from './database.provider';

/**
 * Nest-friendly wrapper around the shared Postgres.js client.
 *
 * This service gives the rest of the application a class-based injectable
 * entry point, while still relying on the raw client created by the custom
 * provider.
 */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  /**
   * Receives the shared Postgres.js client from Nest's DI container.
   *
   * `@Inject(DATABASE_CLIENT)` is required because `DatabaseClient` is only a
   * TypeScript type alias. At runtime, Nest resolves this dependency by the
   * `DATABASE_CLIENT` token exported by `DatabaseModule`.
   *
   * @param sql Shared Postgres.js client used by repositories and services.
   */
  constructor(
    @Inject(DATABASE_CLIENT)
    readonly sql: DatabaseClient,
  ) {}

  /**
   * Closes the Postgres connection pool during Nest shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    await this.sql.end();
  }
}
