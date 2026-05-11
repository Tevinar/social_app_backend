import { Chat } from '../../domain/entities/chat';
import { ChatMessage } from '../../domain/entities/chat-message';

export const CHAT_CREATOR = Symbol('CHAT_CREATOR');

/**
 * Application port used to persist newly created chats atomically.
 */
export interface ChatCreator {
  /**
   * Persists one new chat, its member set, and its first
   * message as one write transaction.
   *
   * @param params Chat creation data to store.
   * @returns The outcome of the creation attempt.
   */
  create(params: CreateChatRecordParams): Promise<CreateChatRecordResult>;
}

/**
 * Data required to create one chat with its first message.
 */
export type CreateChatRecordParams = {
  memberIds: string[];
  firstMessageAuthorId: string;
  firstMessageContent: string;
};

/**
 * Stable chat creation result names.
 */
export enum CreateChatRecordResultType {
  CREATED = 'created',
  MEMBER_NOT_FOUND = 'member_not_found',
}

export type CreateChatRecordResult =
  | {
      type: CreateChatRecordResultType.CREATED;
      chat: Chat;
      firstMessage: ChatMessage;
    }
  | {
      type: CreateChatRecordResultType.MEMBER_NOT_FOUND;
    };
