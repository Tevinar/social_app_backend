import { Inject, Injectable } from '@nestjs/common';
import { type Bucket } from '@google-cloud/storage';
import { STORAGE_CLIENT, type StorageClient } from './storage.provider';
import { storageConfig } from './storage.config';

/**
 * Thin Nest wrapper around the shared Google Cloud Storage client.
 *
 * Exposes the configured bucket handle to feature-level storage adapters.
 */
@Injectable()
export class StorageService {
  /**
   * Receives the shared storage client exposed by the storage provider.
   *
   * @param client Shared Google Cloud Storage client used by feature adapters.
   */
  constructor(
    @Inject(STORAGE_CLIENT)
    readonly client: StorageClient,
  ) {}

  /**
   * Returns the configured application bucket.
   *
   * @returns The bucket used to store application objects.
   */
  bucket(): Bucket {
    return this.client.bucket(storageConfig.bucketName);
  }
}
