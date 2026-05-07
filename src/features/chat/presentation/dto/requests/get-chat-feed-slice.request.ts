import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MIN_LIMIT,
} from '../../../application/pagination/chat-feed.cursor';

/**
 * HTTP query string accepted by the get-chat-feed-slice endpoint.
 */
export class GetChatFeedSliceRequest {
  /**
   * Maximum number of chats to return in the current slice.
   */
  @Type(() => Number)
  @IsInt()
  @Min(MIN_LIMIT)
  @Max(MAX_LIMIT)
  limit = DEFAULT_LIMIT;

  /**
   * Opaque cursor returned by the previous chat-feed response.
   * Clients must pass it back unchanged to fetch the next slice.
   */
  @IsOptional()
  @IsString()
  cursor?: string;
}
