import { ConfigService } from '@nestjs/config';
import { LoggerModuleAsyncParams } from 'nestjs-pino';
import { EnvVariable } from '../../../core/config/env-variable';
import { Environment } from '../../../core/config/environment';
import { LogLevel } from '../../../core/config/log-level';

/**
 * Async Nest Pino module options for the application.
 *
 * This centralizes environment-based logger behavior and redaction policy so
 * the root app module remains focused on composition.
 */
export const pinoLoggerModuleOptions: LoggerModuleAsyncParams = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const environment = configService.getOrThrow<Environment>(
      EnvVariable.AppEnv,
    );

    const logLevel = configService.getOrThrow<LogLevel>(EnvVariable.LogLevel);

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
};
