import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { StorageModule } from '../../core/storage/storage.module';
import { AuthModule } from '../../features/auth/auth.module';

/**
 * Root application module that composes the shared infrastructure modules and
 * the starter controller/service pair.
 */
@Module({
  imports: [DatabaseModule, StorageModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
