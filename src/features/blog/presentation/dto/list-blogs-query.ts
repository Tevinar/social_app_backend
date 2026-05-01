import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  MIN_LIMIT,
  MAX_LIMIT,
  DEFAULT_LIMIT,
} from '../../application/blog-cursor/blog-cursor.constants';

/**
 * HTTP query string accepted by the list-blogs endpoint.
 */
export class ListBlogsCursorQuery {
  /**
   * Maximum number of blogs to return in the current slice.
   */
  @Type(() => Number)
  @IsInt()
  @Min(MIN_LIMIT)
  @Max(MAX_LIMIT)
  limit = DEFAULT_LIMIT;

  /**
   * Opaque cursor returned by the previous list response.
   * Clients must pass it back unchanged to fetch the next slice.
   */
  @IsOptional()
  @IsString()
  cursor?: string;
}
