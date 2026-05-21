import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DatabaseModule } from '../../core/database/database.module';
import { OutboxModule } from '../../core/outbox/outbox.module';
import { ErrorToExceptionMapper } from '../../core/presentation/filters/error-to-exception.mapper';
import { GlobalHttpRequestExceptionFilter } from '../../core/presentation/filters/global-http-request-exception.filter';
import { StorageModule } from '../../core/storage/storage.module';
import { AuthModule } from '../../features/auth/auth.module';
import { BlogModule } from '../../features/blog/blog.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { Environment } from '../../core/config/environment';
import { LogLevel } from '../../core/config/log-level';
import { EnvVariable } from '../../core/config/env-variable';
import { ChatModule } from '../../features/chat/chat.module';
/**
 * Root application module that composes the shared infrastructure modules and
 * global application-level providers.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const environment =
          configService.get<Environment>(EnvVariable.NodeEnv) ??
          Environment.Local;

        const logLevel =
          configService.get<LogLevel>(EnvVariable.LogLevel) ?? LogLevel.Info;

        return {
          pinoHttp: {
            level: logLevel,
            ...(environment === Environment.Production
              ? {}
              : {
                  transport: {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      singleLine: true,
                      translateTime: 'SYS:standard',
                    },
                  },
                }),
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'password',
                'accessToken',
                'refreshToken',
              ],
              censor: '[REDACTED]',
            },
          },
        };
      },
    }),
    DatabaseModule,
    OutboxModule,
    StorageModule,
    AuthModule,
    BlogModule,
    ChatModule,
  ],
  controllers: [],
  providers: [
    ErrorToExceptionMapper,
    {
      provide: APP_FILTER,
      useClass: GlobalHttpRequestExceptionFilter,
    },
  ],
})
export class AppModule {}
