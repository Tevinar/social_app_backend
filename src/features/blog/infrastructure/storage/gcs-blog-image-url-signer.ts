import { Injectable } from '@nestjs/common';
import { StorageService } from '../../../../core/storage/storage.service';
import { BlogImageUrlSigner } from '../../application/ports/blog-image-url-signer';

/**
 * Google Cloud Storage-backed implementation of the blog image URL signer.
 */
@Injectable()
export class GcsBlogImageUrlSigner implements BlogImageUrlSigner {
  /**
   * Receives the shared storage service used to access the configured bucket.
   *
   * @param storage Nest-injected Google Cloud Storage wrapper.
   */
  constructor(private readonly storage: StorageService) {}

  /**
   * Generates a temporary signed URL for reading one private blog image.
   *
   * @param params Storage object key and expiration settings.
   * @param params.imageKey Storage object key to sign.
   * @param params.expiresInSeconds Signed URL lifetime expressed in seconds.
   * @returns Temporary signed URL for the image object.
   */
  async signReadUrl(params: {
    imageKey: string;
    expiresInSeconds: number;
  }): Promise<string> {
    const file = this.storage.bucket().file(params.imageKey);

    const [url] = await file.getSignedUrl({
      // Use the modern signed-URL format explicitly for stable behavior.
      version: 'v4',
      action: 'read',
      // Date.now() is in milliseconds, so seconds must be converted.
      expires: Date.now() + params.expiresInSeconds * 1000,
    });

    return url;
  }
}
