import { type CreatedBlog } from '../../application/ports/blog-creator';

/**
 * HTTP response body returned after a successful blog creation.
 *
 * The DTO exposes timestamps as ISO strings so the transport shape matches the
 * JSON representation sent over HTTP.
 */
export class CreateBlogResponse {
  /**
   * Stable blog identifier.
   */
  id!: string;

  /**
   * Stable identifier of the blog author.
   */
  posterId!: string;

  /**
   * Created blog title.
   */
  title!: string;

  /**
   * Created blog content.
   */
  content!: string;

  /**
   * Storage key of the uploaded blog image.
   */
  imageKey!: string;

  /**
   * Topics associated with the created blog.
   */
  topics!: string[];

  /**
   * Blog creation timestamp serialized as an ISO string.
   */
  createdAt!: string;

  /**
   * Blog last-updated timestamp serialized as an ISO string.
   */
  updatedAt!: string;

  /**
   * Builds the HTTP response DTO from the application-layer blog projection.
   *
   * @param blog Created blog returned by the use case.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromCreatedBlog(blog: CreatedBlog): CreateBlogResponse {
    return {
      id: blog.id,
      posterId: blog.posterId,
      title: blog.title,
      content: blog.content,
      imageKey: blog.imageKey,
      topics: blog.topics,
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
    };
  }
}
