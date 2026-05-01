import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  type BlogCreator,
  type CreateBlogRecordParams,
} from '../../application/ports/blog-creator';
import { BlogRow, mapBlogRowToRecord } from './blog-row';
import { BlogRecord } from '../../application/records/blog';

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
  async create(params: CreateBlogRecordParams): Promise<BlogRecord> {
    const rows = await this.database.sql<BlogRow[]>`
    with inserted as (
      insert into blogs (
        id,
        author_id,
        title,
        content,
        image_key,
        topics
      )
      values (
        ${params.id},
        ${params.posterId},
        ${params.title},
        ${params.content},
        ${params.imageKey},
        ${params.topics}
      )
      returning
        id,
        author_id,
        title,
        content,
        topics,
        created_at,
        updated_at
    )
    select
      i.id,
      i.author_id as "posterId",
      p.name as "posterName",
      i.title,
      i.content,
      i.topics,
      i.created_at as "createdAt",
      i.updated_at as "updatedAt"
    from inserted i
    join profiles p on p.user_id = i.author_id
  `;

    const row = rows[0];

    if (!row) {
      throw new Error('Blog creation failed');
    }

    return mapBlogRowToRecord(row);
  }
}
