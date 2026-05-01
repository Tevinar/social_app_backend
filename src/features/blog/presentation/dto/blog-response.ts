import { Blog } from '../../application/records/blog';

/**
 * HTTP response body representing one blog.
 */
export class BlogResponse {
  /**
   * Stable blog identifier.
   */
  id!: string;

  poster!: {
    id: string;
    name: string;
  };

  /**
   * Created blog title.
   */
  title!: string;

  /**
   * Created blog content.
   */
  content!: string;

  /**
   * URL of the uploaded blog image.
   */
  imageUrl!: string;

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
   * Builds the response DTO from one application blog record.
   *
   * @param blog Application blog record.
   * @returns Response DTO ready for JSON serialization.
   */
  static fromBlog(blog: Blog): BlogResponse {
    return {
      id: blog.id,
      poster: blog.poster,
      title: blog.title,
      content: blog.content,
      imageUrl: blog.imageUrl,
      topics: blog.topics,
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
    };
  }
}
