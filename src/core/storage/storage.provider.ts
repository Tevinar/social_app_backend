import { type Provider } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { storageConfig } from './storage.config';

/**
 * Nest dependency-injection token for the shared Google Cloud Storage client.
 */
export const STORAGE_CLIENT = Symbol('STORAGE_CLIENT');

/**
 * Concrete Google Cloud Storage client type used across the application.
 */
export type StorageClient = Storage;

/**
 * Factory-based Nest provider that creates a single shared storage client for
 * the application.
 */
export const storageProvider: Provider = {
  provide: STORAGE_CLIENT,
  useFactory: (): StorageClient => {
    const options = {
      projectId: storageConfig.projectId,
      ...(storageConfig.apiEndpoint
        ? { apiEndpoint: storageConfig.apiEndpoint }
        : {}),
    };

    return new Storage(options);
  },
};
