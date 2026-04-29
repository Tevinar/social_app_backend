import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../../../../core/pagination/pagination.constants';

/**
 * HTTP query string accepted by the list-blogs endpoint.
 */
export class ListBlogsQuery {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = DEFAULT_PAGE;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize = DEFAULT_PAGE_SIZE;
}
