export const BLOG_IMAGE_URL_SIGNER = Symbol('BLOG_IMAGE_URL_SIGNER');

/**
 * Application port used to generate temporary read URLs for private blog
 * images.
 */
export interface BlogImageUrlSigner {
  /**
   * Signs a temporary URL that allows one client to read a private image.
   *
   * @param params Storage object key and expiration settings.
   * @returns Temporary signed URL for image download.
   */
  fakeSignReadUrl(params: {
    imageKey: string;
    expiresInSeconds: number;
  }): Promise<string>;
}
