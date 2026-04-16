import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { DATABASE_CLIENT, type DatabaseClient } from './database.provider';

/**
 * Thin Nest wrapper around the shared Postgres.js client.
 *
 * Exposes the `sql` client for repositories/services and closes the underlying
 * pool when the Nest application shuts down.
 */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(
    @Inject(DATABASE_CLIENT)
    readonly sql: DatabaseClient,
  ) {}

  /**
   * Closes all open Postgres connections during Nest shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    await this.sql.end();
  }
}
