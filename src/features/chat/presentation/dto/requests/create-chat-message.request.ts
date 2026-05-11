import { IsString, MinLength } from 'class-validator';

/**
 * HTTP request body accepted by the create-chat-message endpoint.
 */
export class CreateChatMessageRequest {
  /**
   * Message content submitted by the caller.
   */
  @IsString()
  @MinLength(1)
  content!: string;
}
