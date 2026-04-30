import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  BlogImageRecord,
  type BlogReader,
  type FindRecentBlogPageParams,
  type RecentBlogsPage,
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
   * Reads one page of blogs ordered from most recent to least recent.
   *
   * @param params Pagination window requested by the caller.
   * @returns Current page of blogs together with the total row count.
   */
  async findRecentPage(
    params: FindRecentBlogPageParams,
  ): Promise<RecentBlogsPage> {
    const [rows, countRows] = await Promise.all([
      this.database.sql<BlogPageRow[]>`
        select
          b.id,
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
        offset ${params.offset}
      `,
      this.database.sql<BlogCountRow[]>`
        select count(*)::int as "totalCount"
        from blogs
      `,
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        poster: {
          id: row.posterId,
          name: row.posterName,
        },
        title: row.title,
        content: row.content,
        imagePath: `/blogs/${row.id}/image`,
        topics: row.topics,
      })),
      totalCount: countRows[0]?.totalCount ?? 0,
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

type BlogPageRow = {
  id: string;
  posterId: string;
  posterName: string;
  title: string;
  content: string;
  topics: string[];
};

type BlogCountRow = {
  totalCount: number;
};

type BlogImageRow = {
  blogId: string;
  imageKey: string;
};
