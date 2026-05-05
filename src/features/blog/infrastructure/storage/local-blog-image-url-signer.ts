import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVariable } from '../../../../core/config/env-variable';
import { BlogImageUrlSigner } from '../../application/ports/blog-image-url-signer.port';

/**
 * Local-only signer that returns a direct fake GCS object URL instead of
 * generating a real Google signed URL.
 */
@Injectable()
export class LocalBlogImageUrlSigner implements BlogImageUrlSigner {
  /**
   * Receives runtime configuration needed to build fake GCS object URLs.
   *
   * @param configService Shared Nest config service.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Returns a direct fake GCS object URL for one blog image in local
   * development.
   *
   * @param params Storage object key and expiration settings.
   * @param params.imageKey Storage object key to expose locally.
   * @param params.expiresInSeconds Requested signed URL lifetime in seconds.
   * @returns Direct fake GCS object URL.
   */
  signReadUrl(params: {
    imageKey: string;
    expiresInSeconds: number;
  }): Promise<string> {
    const host = this.configService.getOrThrow<string>(EnvVariable.GcsHost);
    const port = this.configService.getOrThrow<string>(EnvVariable.GcsPort);
    const bucket = this.configService.getOrThrow<string>(
      EnvVariable.GcsBucketName,
    );

    const encodedKey = params.imageKey
      .split('/')
      .map(encodeURIComponent)
      .join('/');

    // expiresInSeconds is ignored locally because fake-gcs does not validate
    // signed-url query params.
    return Promise.resolve(`https://${host}:${port}/${bucket}/${encodedKey}`);
  }
}
