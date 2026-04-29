import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  CreatedBlog,
  type BlogCreator,
  type CreateBlogRecordParams,
} from '../../application/ports/blog-creator';

/**
 * PostgreSQL object identifier for the `text` type.
 */
const POSTGRES_TEXT_OID = 25;

/**
 * Row shape returned by the blog creation query.
 */
type BlogRow = {
  id: string;
  posterId: string;
  title: string;
  content: string;
  imageKey: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Postgres-backed implementation of the blog creator port.
 */
@Injectable()
export class PostgresBlogCreator implements BlogCreator {
  /**
   * Receives the shared database service used to insert blog records.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Persists a blog row and maps poster foreign-key failures to a stable
   * application outcome.
   *
   * @param params Blog data to persist.
   * @returns The outcome of the blog creation attempt.
   */
  async create(params: CreateBlogRecordParams): Promise<CreatedBlog> {
    const rows = await this.database.sql<BlogRow[]>`
        insert into blogs (
          id,
          author_id,
          title,
          topics,
          image_key,
          content
        )
        values (
          ${params.id},
          ${params.posterId},
          ${params.title},
          ${this.database.sql.array(params.topics, POSTGRES_TEXT_OID)}::text[],
          ${params.imageKey},
          ${params.content}
        )
        returning
          id,
          author_id as "posterId",
          title,
          content,
          image_key as "imageKey",
          topics,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
    const blog = rows[0];

    if (!blog) {
      throw new Error('Blog creation did not return a created row');
    }

    return blog;
  }
}
