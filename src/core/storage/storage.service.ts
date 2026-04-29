import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Bucket, type Storage } from '@google-cloud/storage';
import { STORAGE_CLIENT } from './storage.provider';
import { EnvVariable } from '../config/env-variable';

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
   * @param configService Shared Nest config service used to resolve runtime
   *   storage settings.
   */
  constructor(
    @Inject(STORAGE_CLIENT)
    readonly client: Storage,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Returns the configured application bucket.
   *
   * @returns The bucket used to store application objects.
   */
  bucket(): Bucket {
    return this.client.bucket(
      this.configService.getOrThrow<string>(EnvVariable.GcsBucketName),
    );
  }
}
