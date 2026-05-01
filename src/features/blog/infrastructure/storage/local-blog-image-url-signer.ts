import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVariable } from '../../../../core/config/env-variable';
import { BlogImageUrlSigner } from '../../application/ports/blog-image-url-signer';

/**
 * Local-only signer that returns a direct fake GCS object URL instead of
 * generating a real Google signed URL.
 */
@Injectable()
export class LocalBlogImageUrlSigner implements BlogImageUrlSigner {
  constructor(private readonly configService: ConfigService) {}

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
