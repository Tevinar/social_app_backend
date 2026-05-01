import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  BlogImageRecord,
  type BlogReader,
  type FindRecentBlogSliceParams,
  type RecentBlogsSlice,
} from '../../application/ports/blog-reader';
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
          b.topics
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
          b.topics
        from blogs b
        join profiles p
          on p.user_id = b.author_id
        order by b.created_at desc, b.id desc
        limit ${params.limit}
      `;

    return {
      items: rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        poster: {
          id: row.posterId,
          name: row.posterName,
        },
        title: row.title,
        content: row.content,
        imagePath: `/blogs/${row.id}/image`,
        topics: row.topics,
      })),
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
}

type BlogRow = {
  id: string;
  createdAt: Date;
  posterId: string;
  posterName: string;
  title: string;
  content: string;
  topics: string[];
};

type BlogImageRow = {
  blogId: string;
  imageKey: string;
};
