import { Module } from '@nestjs/common';
import { STORAGE_CLIENT, storageProvider } from './storage.provider';
import { StorageService } from './storage.service';

/**
 * Shared storage module that registers and exports the configured Cloud
 * Storage client and its thin Nest wrapper.
 */
@Module({
  providers: [storageProvider, StorageService],
  exports: [STORAGE_CLIENT, StorageService],
})
export class StorageModule {}
