import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/bootstrap/app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { EnvVariable } from './core/config/env-variable';

/**
 * Boots the Nest application, enables graceful shutdown hooks, and starts the
 * HTTP server on the configured port.
 *
 * @returns A promise that resolves once the server is listening.
 */
async function bootstrap(): Promise<void> {
  // bufferLogs: true tells Nest to temporarily store startup logs until custom logger is ready.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Replace the default Nest logger with our configured Pino logger, and flush
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  app.enableShutdownHooks();
  await app.listen(configService.getOrThrow<number>(EnvVariable.port));
}

void bootstrap();
