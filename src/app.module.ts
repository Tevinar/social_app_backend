import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './storage/storage.module';

/**
 * Root application module that composes the shared infrastructure modules and
 * the starter controller/service pair.
 */
@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
