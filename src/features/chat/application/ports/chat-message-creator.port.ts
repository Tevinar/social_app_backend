import { Chat } from '../../domain/entities/chat';
import { ChatMessage } from '../../domain/entities/chat-message';

export const CHAT_MESSAGE_CREATOR = Symbol('CHAT_MESSAGE_CREATOR');

/**
 * Application port used to persist newly created chat messages atomically.
 */
export interface ChatMessageCreator {
  /**
   * Persists one new message and the resulting chat-feed update as one write
   * transaction.
   *
   * @param params Chat-message creation data to store.
   * @returns The outcome of the creation attempt.
   */
  create(
    params: CreateChatMessageRecordParams,
  ): Promise<CreateChatMessageRecordResult>;
}

/**
 * Data required to create one message inside an existing chat.
 */
export type CreateChatMessageRecordParams = {
  chatId: string;
  authorId: string;
  content: string;
};

/**
 * Stable chat-message creation result names.
 */
export enum CreateChatMessageRecordResultType {
  CREATED = 'created',
  CHAT_NOT_FOUND = 'chat_not_found',
}

export type CreateChatMessageRecordResult =
  | {
      type: CreateChatMessageRecordResultType.CREATED;
      chat: Chat;
      chatMessage: ChatMessage;
    }
  | {
      type: CreateChatMessageRecordResultType.CHAT_NOT_FOUND;
    };
