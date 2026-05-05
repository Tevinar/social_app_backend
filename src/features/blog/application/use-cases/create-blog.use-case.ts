import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UseCase } from '../../../../core/contracts/use-case';
import { BlogContent } from '../../domain/value-objects/blog-content';
import { BlogImage } from '../../domain/value-objects/blog-image';
import { BlogTitle } from '../../domain/value-objects/blog-title';
import { BlogTopic } from '../../domain/value-objects/blog-topic';
import { BLOG_CREATOR, type BlogCreator } from '../ports/blog-creator.port';
import {
  BLOG_IMAGE_STORAGE,
  type BlogImageStorage,
} from '../ports/blog-image-storage.port';
import {
  BLOG_FEED_EVENT_BUS,
  type BlogFeedEventBus,
} from '../ports/blog-feed-event-bus.port';
import { BlogReadModel } from '../models/blog.model';
import { ConfigService } from '@nestjs/config';
import { EnvVariable } from '../../../../core/config/env-variable';

/**
 * Application use case responsible for creating a blog post and storing its
 * image object.
 */
@Injectable()
export class CreateBlogUseCase implements UseCase<
  CreateBlogParams,
  BlogReadModel
> {
  /**
   * Receives the capabilities required to authenticate the caller, store a
   * blog image, and persist the blog record.
   *
   * @param blogCreator Persists the blog record.
   * @param blogImageStorage Stores and removes blog image objects.
   * @param blogFeedEventBus Publishes feed-level blog creation signals.
   * @param configService Reads runtime configuration values.
   */
  constructor(
    @Inject(BLOG_CREATOR)
    private readonly blogCreator: BlogCreator,
    @Inject(BLOG_IMAGE_STORAGE)
    private readonly blogImageStorage: BlogImageStorage,
    @Inject(BLOG_FEED_EVENT_BUS)
    private readonly blogFeedEventBus: BlogFeedEventBus,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Creates a new blog record for the authenticated caller.
   *
   * The image is saved first so the resulting storage key can be committed with
   * the blog row. If database creation fails after the upload succeeds, the use
   * case makes a best-effort attempt to remove the uploaded image.
   *
   * @param params Blog data submitted by the caller.
   * @returns The created blog projection.
   * @throws {InvalidAccessTokenError} Thrown when the access token is invalid.
   * @throws {InvalidBlogTitleError} Thrown when title is blank.
   * @throws {InvalidBlogContentError} Thrown when content is blank.
   * @throws {InvalidBlogImageError} Thrown when image data is empty or not an
   * accepted image content type.
   * @throws {InvalidBlogTopicError} Thrown when topics contain blank values.
   * @throws {BlogPosterNotFoundError} Thrown when no user owns the token's
   * authenticated identifier.
   */
  async execute(params: CreateBlogParams): Promise<BlogReadModel> {
    const blogId = randomUUID();
    const title = BlogTitle.from(params.title);
    const content = BlogContent.from(params.content);
    const topics = params.topics.map((topic) => BlogTopic.from(topic));
    const image = await BlogImage.from(params.imageBuffer);
    const imageKey = await this.blogImageStorage.save({
      blogId,
      image,
    });

    try {
      const blog = await this.blogCreator.create({
        id: blogId,
        posterId: params.userId,
        title: title.value,
        content: content.value,
        imageKey,
        topics: topics.map((topic) => topic.value),
      });

      // Notify subscribers that a new blog is available for their feed.
      this.blogFeedEventBus.publish({
        type: 'feed.new_blog_available',
        blogId: blog.id,
      });

      return {
        id: blog.id,
        poster: blog.poster,
        title: blog.title,
        content: blog.content,
        imageUrl: `${this.configService.getOrThrow<string>(
          EnvVariable.ApiBaseUrl,
        )}${blog.imagePath}`,
        topics: blog.topics,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
      };
    } catch (error: unknown) {
      await this.blogImageStorage.delete(imageKey);
      throw error;
    }
  }
}

/**
 * Input required to create a blog.
 */
export type CreateBlogParams = {
  userId: string;
  title: string;
  content: string;
  imageBuffer: Buffer;
  topics: string[];
};
