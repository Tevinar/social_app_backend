import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/bootstrap/app.module';
import { ConfigService } from '@nestjs/config';

/**
 * Boots the Nest application, enables graceful shutdown hooks, and starts the
 * HTTP server on the configured port.
 *
 * @returns A promise that resolves once the server is listening.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableShutdownHooks();
  await app.listen(configService.get<number>('PORT') ?? 3000);
}

void bootstrap();
