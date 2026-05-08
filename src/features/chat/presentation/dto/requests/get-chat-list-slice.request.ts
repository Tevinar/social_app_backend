import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MIN_LIMIT,
} from '../../../application/pagination/chat-list.cursor';

/**
 * HTTP query string accepted by the get-chat-list-slice endpoint.
 */
export class GetChatListSliceRequest {
  /**
   * Maximum number of chats to return in the current slice.
   */
  @Type(() => Number)
  @IsInt()
  @Min(MIN_LIMIT)
  @Max(MAX_LIMIT)
  limit = DEFAULT_LIMIT;

  /**
   * Opaque cursor returned by the previous chat-list response.
   * Clients must pass it back unchanged to fetch the next slice.
   */
  @IsOptional()
  @IsString()
  cursor?: string;
}
