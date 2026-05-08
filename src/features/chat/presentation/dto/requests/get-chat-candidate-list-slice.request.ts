import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MIN_LIMIT,
} from '../../../application/pagination/chat-candidate.cursor';

/**
 * HTTP query string accepted by the get-chat-candidate-list-slice endpoint.
 */
export class GetChatCandidateListSliceRequest {
  /**
   * Maximum number of chat candidates to return in the current slice.
   */
  @Type(() => Number)
  @IsInt()
  @Min(MIN_LIMIT)
  @Max(MAX_LIMIT)
  limit = DEFAULT_LIMIT;

  /**
   * Opaque cursor returned by the previous candidates response.
   * Clients must pass it back unchanged to fetch the next slice.
   */
  @IsOptional()
  @IsString()
  cursor?: string;
}
