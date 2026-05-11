import { BlogPoster } from './blog-poster';

/**
 * Domain entity representing one blog returned by blog application reads.
 */
export class Blog {
  /**
   * Creates one immutable blog entity.
   *
   * @param params Blog data.
   * @param params.id Stable blog identifier.
   * @param params.poster Public poster summary.
   * @param params.title Blog title.
   * @param params.content Blog content.
   * @param params.imagePath Internal image path.
   * @param params.topics Associated topic labels.
   * @param params.createdAt Creation timestamp.
   * @param params.updatedAt Last-update timestamp.
   * @returns A blog domain entity.
   */
  static create(params: {
    id: string;
    poster: BlogPoster;
    title: string;
    content: string;
    imagePath: string;
    topics: string[];
    createdAt: Date;
    updatedAt: Date;
  }): Blog {
    return new Blog(
      params.id,
      params.poster,
      params.title,
      params.content,
      params.imagePath,
      params.topics,
      params.createdAt,
      params.updatedAt,
    );
  }

  /**
   * Stores immutable blog state.
   *
   * @param id Stable blog identifier.
   * @param poster Public poster summary.
   * @param title Blog title.
   * @param content Blog content.
   * @param imagePath Internal image path.
   * @param topics Associated topic labels.
   * @param createdAt Creation timestamp.
   * @param updatedAt Last-update timestamp.
   */
  private constructor(
    readonly id: string,
    readonly poster: BlogPoster,
    readonly title: string,
    readonly content: string,
    readonly imagePath: string,
    readonly topics: string[],
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}
}
