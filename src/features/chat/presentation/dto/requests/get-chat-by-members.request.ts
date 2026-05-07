import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

/**
 * HTTP query string accepted by the get-chat-by-members endpoint.
 */
export class GetChatByMembersRequest {
  /**
   * Other chat members used to look up one existing chat.
   */
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value as string[];
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    return [];
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(4, { each: true })
  members!: string[];
}
