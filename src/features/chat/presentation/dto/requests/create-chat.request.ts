import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

/**
 * HTTP request body accepted by the create-chat endpoint.
 */
export class CreateChatRequest {
  /**
   * Other chat members selected by the caller.
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
  @ArrayMinSize(1)
  @IsUUID(4, { each: true })
  members!: string[];

  /**
   * Initial message content sent with the new chat.
   */
  @IsString()
  @MinLength(1)
  firstMessageContent!: string;
}
