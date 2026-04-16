import { Module } from '@nestjs/common';
import { DATABASE_CLIENT, databaseProvider } from './database.provider';
import { DatabaseService } from './database.service';

/**
 * Database module that registers and exports the shared PostgreSQL client and
 * its thin Nest service wrapper.
 */
@Module({
  providers: [databaseProvider, DatabaseService],
  exports: [DATABASE_CLIENT, DatabaseService],
})
export class DatabaseModule {}
