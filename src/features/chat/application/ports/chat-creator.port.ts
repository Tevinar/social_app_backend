export const CHAT_CREATOR = Symbol('CHAT_CREATOR');

/**
 * Application port used to persist newly created chats atomically.
 */
export interface ChatCreator {
  /**
   * Persists one new chat, its participant membership set, and its first
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
  participantIds: string[];
  firstMessageAuthorId: string;
  firstMessageContent: string;
};

/**
 * Stable chat creation result names.
 */
export enum CreateChatRecordResult {
  CREATED = 'created',
  PARTICIPANT_NOT_FOUND = 'participant_not_found',
}
