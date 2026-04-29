import { fileTypeFromBuffer } from 'file-type';

/**
 * Value object representing a validated blog image file.
 */
export class BlogImage {
  /**
   * Creates a blog image from already-validated image data.
   *
   * Use {@link BlogImage.from} instead of calling the constructor directly.
   *
   * @param buffer Exact image bytes accepted by the application.
   * @param contentType Detected MIME type for the image bytes.
   */
  private constructor(
    readonly buffer: Buffer,
    readonly contentType: string,
  ) {}

  /**
   * Builds a blog image from raw uploaded bytes.
   *
   * The image must be non-empty and resolvable to one of the supported image
   * MIME types.
   *
   * @param imageBuffer Raw uploaded image bytes.
   * @returns A validated blog image value object.
   * @throws {InvalidBlogImageError} Thrown when the buffer is empty or cannot
   * be identified as a supported image.
   */
  static async from(imageBuffer: Buffer): Promise<BlogImage> {
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      throw new InvalidBlogImageError();
    }

    const detected = await fileTypeFromBuffer(imageBuffer);

    if (
      !detected ||
      !new Set(['image/gif', 'image/jpeg', 'image/png', 'image/webp']).has(
        detected.mime,
      )
    ) {
      throw new InvalidBlogImageError();
    }

    return new BlogImage(imageBuffer, detected.mime);
  }
}

/**
 * Signals that the submitted blog image cannot be accepted.
 */
class InvalidBlogImageError extends Error {
  /**
   * Creates a stable validation error for rejected blog images.
   */
  constructor() {
    super('Invalid blog image');
  }
}
