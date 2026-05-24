import { type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { EnvVariable } from '../config/env-variable';

/**
 * Nest dependency-injection token for the shared Google Cloud Storage client.
 */
export const STORAGE_CLIENT = Symbol('STORAGE_CLIENT');

/**
 * Builds the custom storage endpoint used when a local GCS-compatible server
 * is configured through environment variables.
 *
 * @param configService Shared Nest config service.
 * @returns The emulator endpoint, or `undefined` when no custom host/port is
 *   configured.
 */
function getFakeStorageApiEndpoint(
  configService: ConfigService,
): string | undefined {
  const host = configService.get<string>(EnvVariable.FakeGcsHost);
  const port = configService.get<string>(EnvVariable.FakeGcsPort);

  return host && port ? `https://${host}:${port}` : undefined;
}

/**
 * Factory-based Nest provider that creates a single shared storage client for
 * the application.
 */
export const storageProvider: Provider = {
  provide: STORAGE_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Storage => {
    const projectId = configService.getOrThrow<string>(
      EnvVariable.GoogleCloudProjectId,
    );
    const apiEndpoint = getFakeStorageApiEndpoint(configService);

    // When no fake-GCS endpoint override is configured, the official client
    // falls back to the real Google Cloud Storage service automatically.
    const options = {
      projectId,
      ...(apiEndpoint ? { apiEndpoint } : {}),
    };

    return new Storage(options);
  },
};
