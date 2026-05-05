import { Injectable } from '@nestjs/common';
import { StorageService } from '../../../../core/storage/storage.service';
import {
  type BlogImageStorage,
  type SaveBlogImageParams,
} from '../../application/ports/blog-image-storage.port';

/**
 * Google Cloud Storage-backed implementation of blog image storage.
 */
@Injectable()
export class GcsBlogImageStorage implements BlogImageStorage {
  /**
   * Receives the shared storage service used to access the configured bucket.
   *
   * @param storage Nest-injected Google Cloud Storage wrapper.
   */
  constructor(private readonly storage: StorageService) {}

  /**
   * Saves the image object under a key derived from the owning blog id.
   *
   * @param params Image data and blog identifier.
   * @returns Stored image key.
   */
  async save(params: SaveBlogImageParams): Promise<string> {
    const key = `blogs/${params.blogId}/image`;
    const file = this.storage.bucket().file(key);

    await file.save(params.image.buffer, {
      contentType: params.image.contentType,
      resumable: false,
    });

    return key;
  }

  /**
   * Deletes a blog image object if it exists.
   *
   * @param key Storage object key to remove.
   */
  async delete(key: string): Promise<void> {
    await this.storage.bucket().file(key).delete({
      ignoreNotFound: true,
    });
  }
}
