import { BlogPoster } from '../../domain/entities/blog-poster';
import { Blog } from '../../domain/entities/blog';

/**
 * Row shape returned by the blog reader's SQL queries.
 *
 * This type is internal to the persistence layer and should not be used outside
 * of it. It may contain fields that are not present in the domain model, such as
 * database-specific metadata or denormalized data for query efficiency.
 */
export type BlogRow = {
  id: string;
  posterId: string;
  posterName: string;
  title: string;
  content: string;
  imageKey: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Maps one raw SQL blog row into the blog entity.
 *
 * @param row Raw SQL row returned by the persistence layer.
 * @returns Blog entity ready for application use.
 */
export function mapBlogRowToRecord(row: BlogRow): Blog {
  return Blog.create({
    id: row.id,
    poster: BlogPoster.create({
      id: row.posterId,
      name: row.posterName,
    }),
    title: row.title,
    content: row.content,
    imagePath: `/blogs/${row.id}/image`,
    topics: row.topics,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
