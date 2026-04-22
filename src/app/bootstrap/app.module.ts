import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { StorageModule } from '../../core/storage/storage.module';
import { AuthModule } from '../../features/auth/auth.module';
import { ConfigModule } from '@nestjs/config';

/**
 * Root application module that composes the shared infrastructure modules and
 * the starter controller/service pair.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    StorageModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
