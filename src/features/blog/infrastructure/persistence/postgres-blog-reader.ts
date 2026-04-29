import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  type BlogReader,
  type FindRecentBlogPageParams,
  type RecentBlogsPage,
} from '../../application/ports/blog-reader';

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
}
