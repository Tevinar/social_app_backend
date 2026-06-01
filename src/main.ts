import './app/bootstrap/init-sentry';
import * as Sentry from '@sentry/nestjs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/bootstrap/app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { EnvVariable } from './core/config/env-variable';
import { INestApplication } from '@nestjs/common';
import { Environment } from './core/config/environment';

void bootstrap();

/**
 * Boots the Nest application, enables graceful shutdown hooks, and starts the
 * HTTP server on the configured port.
 *
 * @returns A promise that resolves once the server is listening.
 */
async function bootstrap(): Promise<void> {
  // Create the Nest application from the root module and buffer startup logs
  // until the custom logger is attached.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Resolve the configured Pino logger from Nest's DI container and replace the
  // default Nest logger with it.
  app.useLogger(app.get(Logger));

  // Resolve the shared configuration service so runtime settings can be read.
  const configService = app.get(ConfigService);

  // Enable graceful shutdown handling so Nest can react to termination signals.
  app.enableShutdownHooks();

  const nodeEnv = configService.get<Environment>(EnvVariable.NodeEnv);

  // Only set up Swagger in non-production environments to avoid exposing API docs
  if (nodeEnv !== Environment.Production) {
    setupSwagger(app);
  }

  // Start listening on the configured HTTP port and keep the process alive.
  await app
    .listen(configService.getOrThrow<number>(EnvVariable.port))
    .catch(async (error) => {
      console.error('Application failed to start', error);
      Sentry.captureException(error);
      await Sentry.flush(2000);
      process.exit(1);
    });
}

/**
 * Builds and exposes the OpenAPI documentation for the running HTTP app.
 *
 * The Swagger setup has three responsibilities:
 * - define the base API metadata and shared auth scheme
 * - generate one OpenAPI document by scanning the Nest application
 * - publish the interactive docs UI and raw spec endpoints over HTTP
 *
 * @param app Running Nest application whose HTTP routes should be documented.
 */
function setupSwagger(app: INestApplication): void {
  // Define the top-level OpenAPI metadata that appears in the generated spec
  // and Swagger UI header.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Social App Backend API')
    .setDescription('HTTP API for auth, blogs, and chats')
    .setVersion('1.0.0')
    // Register bearer-token authentication as a reusable OpenAPI security
    // scheme so protected endpoints can reference it in the docs.
    .addBearerAuth()
    .build();

  // Generate the full OpenAPI document by scanning controllers, routes, DTOs,
  // and Swagger decorators from the running Nest app.
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    // Use controller method names directly as operation IDs so generated client
    // names stay concise.
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });

  // Expose the interactive Swagger UI at `/docs` and also serve the raw OpenAPI
  // definition in both JSON and YAML for tooling and client generation.
  SwaggerModule.setup('docs', app, document, {
    raw: ['json', 'yaml'],
  });
}
