import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  BlogImageRecord,
  type BlogReader,
  type FindRecentBlogSliceParams,
  type RecentBlogsSlice,
} from '../../application/ports/blog-reader.port';
import { BlogRow, mapBlogRowToRecord } from './blog-row';
import { Blog } from '../../domain/entities/blog';
/**
 * Postgres-backed implementation of the blog reader port.
 */
@Injectable()
export class PostgresBlogReader implements BlogReader {
  /**
   * Receives the shared database service used to query blog rows.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Reads one recent slice of blogs ordered from most recent to least recent.
   *
   * @param params Cursor window requested by the caller.
   * @returns Current slice of blogs.
   */
  async findRecentSlice(
    params: FindRecentBlogSliceParams,
  ): Promise<RecentBlogsSlice> {
    const rows = params.cursor
      ? await this.database.sql<BlogRow[]>`
        select
          b.id,
          b.created_at as "createdAt",
          b.author_id as "posterId",
          p.name as "posterName",
          b.title,
          b.content,
          b.topics,
          b.updated_at as "updatedAt"
        from blogs b
        join profiles p
          on p.user_id = b.author_id
        where (b.created_at, b.id) < (${params.cursor.createdAt}, ${params.cursor.id})
        order by b.created_at desc, b.id desc
        limit ${params.limit}
      `
      : await this.database.sql<BlogRow[]>`
        select
          b.id,
          b.created_at as "createdAt",
          b.author_id as "posterId",
          p.name as "posterName",
          b.title,
          b.content,
          b.topics,
          b.updated_at as "updatedAt"
        from blogs b
        join profiles p
          on p.user_id = b.author_id
        order by b.created_at desc, b.id desc
        limit ${params.limit}
      `;

    return {
      items: rows.map(mapBlogRowToRecord),
    };
  }

  /**
   * Returns the image record associated with one blog.
   *
   * @param blogId Stable blog identifier.
   * @returns Blog image record when found, otherwise null.
   */
  async findImageByBlogId(blogId: string): Promise<BlogImageRecord | null> {
    const rows = await this.database.sql<BlogImageRow[]>`
    select
      id as "blogId",
      image_key as "imageKey"
    from blogs
    where id = ${blogId}
    limit 1
  `;

    return rows[0] ?? null;
  }

  /**
   * Reads one blog by its stable identifier.
   *
   * @param blogId Stable blog identifier.
   * @returns Blog record when found, otherwise null.
   */
  async findById(blogId: string): Promise<Blog | null> {
    const rows = await this.database.sql<BlogRow[]>`
    select
      b.id,
      b.author_id as "posterId",
      p.name as "posterName",
      b.title,
      b.content,
      b.topics,
      b.created_at as "createdAt",
      b.updated_at as "updatedAt"
    from blogs b
    join profiles p on p.user_id = b.author_id
    where b.id = ${blogId}
    limit 1`;
    const row = rows[0];

    if (!row) {
      return null;
    }

    return mapBlogRowToRecord(row);
  }
}

type BlogImageRow = {
  blogId: string;
  imageKey: string;
};
