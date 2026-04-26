import { type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { EnvVariable } from '../config/env-variable';

/**
 * Nest dependency-injection token for the shared Google Cloud Storage client.
 */
export const STORAGE_CLIENT = Symbol('STORAGE_CLIENT');

/**
 * Concrete Google Cloud Storage client type used across the application.
 */
export type StorageClient = Storage;

/**
 * Builds the custom storage endpoint used when a local GCS-compatible server
 * is configured through environment variables.
 *
 * @param configService Shared Nest config service.
 * @returns The emulator endpoint, or `undefined` when no custom host/port is
 *   configured.
 */
function getStorageApiEndpoint(
  configService: ConfigService,
): string | undefined {
  const host = configService.get<string>(EnvVariable.GcsHost);
  const port = configService.get<string>(EnvVariable.GcsPort);

  return host && port ? `https://${host}:${port}` : undefined;
}

/**
 * Factory-based Nest provider that creates a single shared storage client for
 * the application.
 */
export const storageProvider: Provider = {
  provide: STORAGE_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): StorageClient => {
    const projectId = configService.getOrThrow<string>(
      EnvVariable.GcsProjectId,
    );
    const apiEndpoint = getStorageApiEndpoint(configService);
    const options = {
      projectId,
      ...(apiEndpoint ? { apiEndpoint } : {}),
    };

    return new Storage(options);
  },
};
