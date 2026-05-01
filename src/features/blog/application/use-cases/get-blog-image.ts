import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../../core/contracts/use-case';
import {
  BLOG_IMAGE_URL_SIGNER,
  type BlogImageUrlSigner,
} from '../ports/blog-image-url-signer';
import { BLOG_READER, type BlogReader } from '../ports/blog-reader';
import { BlogNotFoundError } from '../errors/blog-not-found';

/**
 * Application use case responsible for granting temporary access to one blog
 * image.
 */
@Injectable()
export class GetBlogImageUseCase implements UseCase<
  GetBlogImageParams,
  BlogImageRedirect
> {
  /**
   * Receives the capabilities required to look up the stored image key and
   * sign a temporary read URL.
   *
   * @param blogReader Reads blog image records from persistence.
   * @param blogImageUrlSigner Generates temporary storage read URLs.
   */
  constructor(
    @Inject(BLOG_READER)
    private readonly blogReader: BlogReader,
    @Inject(BLOG_IMAGE_URL_SIGNER)
    private readonly blogImageUrlSigner: BlogImageUrlSigner,
  ) {}

  /**
   * Returns a signed URL for the requested blog image.
   *
   * @param params Stable identifier of the target blog.
   * @returns Redirect payload containing the temporary signed URL.
   * @throws {BlogNotFoundError} Thrown when the blog does not exist.
   */
  async execute(params: GetBlogImageParams): Promise<BlogImageRedirect> {
    const blogImage = await this.blogReader.findImageByBlogId(params.blogId);

    if (!blogImage) {
      throw new BlogNotFoundError();
    }

    const signedUrl = await this.blogImageUrlSigner.signReadUrl({
      imageKey: blogImage.imageKey,
      expiresInSeconds: 60,
    });

    return { signedUrl };
  }
}

/**
 * Input required to retrieve one blog image.
 */
export type GetBlogImageParams = {
  blogId: string;
};

/**
 * Redirect target returned after a blog image URL is signed.
 */
export type BlogImageRedirect = {
  signedUrl: string;
};
