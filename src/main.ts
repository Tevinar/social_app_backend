import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/bootstrap/app.module';

/**
 * Boots the Nest application, enables graceful shutdown hooks, and starts the
 * HTTP server on the configured port.
 *
 * @returns A promise that resolves once the server is listening.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
