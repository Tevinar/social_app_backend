import { Transform } from 'class-transformer';
import { IsArray, IsString, MinLength } from 'class-validator';

/**
 * HTTP request body accepted by the create-blog endpoint.
 */
export class CreateBlogRequest {
  /**
   * Blog title submitted by the caller.
   */
  @IsString()
  @MinLength(1)
  title!: string;

  /**
   * Blog content submitted by the caller.
   */
  @IsString()
  @MinLength(1)
  content!: string;

  /**
   * Topic names submitted for the blog.
   */
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value as string[];
    }

    if (typeof value === 'string') {
      return [value];
    }

    return [];
  })
  @IsArray()
  @IsString({ each: true })
  topics!: string[];
}
