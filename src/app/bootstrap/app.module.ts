import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ChatModule } from '../../features/chat/chat.module';
import { DatabaseModule } from '../../core/database/database.module';
import { OutboxModule } from '../../core/outbox/outbox.module';
import { HealthController } from '../../core/presentation/health.controller';
import { ErrorToExceptionMapper } from '../../core/presentation/filters/error-to-exception.mapper';
import { GlobalHttpRequestExceptionFilter } from '../../core/presentation/filters/global-http-request-exception.filter';
import { StorageModule } from '../../core/storage/storage.module';
import { AuthModule } from '../../features/auth/auth.module';
import { BlogModule } from '../../features/blog/blog.module';
import { pinoLoggerModuleOptions } from './logging/pino-logger-module-options';
/**
 * Root application module that composes the shared infrastructure modules and
 * global application-level providers.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    LoggerModule.forRootAsync(pinoLoggerModuleOptions),
    DatabaseModule,
    OutboxModule,
    StorageModule,
    AuthModule,
    BlogModule,
    ChatModule,
  ],
  controllers: [HealthController],
  providers: [
    ErrorToExceptionMapper,
    {
      provide: APP_FILTER,
      useClass: GlobalHttpRequestExceptionFilter,
    },
  ],
})
export class AppModule {}
