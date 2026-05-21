import { Chat } from '../../domain/entities/chat';
import { ChatLastMessage } from '../../domain/entities/chat-last-message';
import { ChatMessage } from '../../domain/entities/chat-message';
import { UserSummary } from '../../domain/entities/user-summary';
import {
  ChatListEvent,
  type ChatListEventType,
} from '../../domain/events/chat-list.event';
import {
  ChatMessageListEvent,
  type ChatMessageListEventType,
} from '../../domain/events/chat-message-list.event';

type UserSummaryPayload = {
  id: string;
  name: string;
};

type ChatLastMessagePayload = {
  id: string;
  author: UserSummaryPayload | null;
  content: string;
  createdAt: string;
};

type ChatPayload = {
  id: string;
  members: UserSummaryPayload[];
  lastMessage: ChatLastMessagePayload | null;
};

type ChatMessagePayload = {
  id: string;
  chatId: string;
  author: UserSummaryPayload | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type ChatListEventPayload = {
  type: ChatListEventType;
  chat: ChatPayload;
};

type ChatMessageListEventPayload = {
  type: ChatMessageListEventType;
  chatMessage: ChatMessagePayload;
  visibleToUserIds: string[];
};

/**
 * Serializes one chat-list domain event to a Kafka payload string.
 *
 * @param event Chat-list event to encode.
 * @returns JSON payload ready to publish to Kafka.
 */
export function encodeChatListEvent(event: ChatListEvent): string {
  const payload: ChatListEventPayload = {
    type: event.type,
    chat: {
      id: event.chat.id,
      members: event.chat.members.map(encodeUserSummary),
      lastMessage: event.chat.lastMessage
        ? {
            id: event.chat.lastMessage.id,
            author: event.chat.lastMessage.author
              ? encodeUserSummary(event.chat.lastMessage.author)
              : null,
            content: event.chat.lastMessage.content,
            createdAt: event.chat.lastMessage.createdAt.toISOString(),
          }
        : null,
    },
  };

  return JSON.stringify(payload);
}

/**
 * Rebuilds one chat-list domain event from a Kafka payload string.
 *
 * @param payload JSON payload consumed from Kafka.
 * @returns Reconstructed chat-list domain event.
 */
export function decodeChatListEvent(payload: string): ChatListEvent {
  const parsedPayload = JSON.parse(payload) as ChatListEventPayload;
  const chat = decodeChat(parsedPayload.chat);

  switch (parsedPayload.type) {
    case 'chat.added':
      return ChatListEvent.chatAdded(chat);
    case 'chat.updated':
      return ChatListEvent.chatUpdated(chat);
  }
}

/**
 * Serializes one chat-message domain event to a Kafka payload string.
 *
 * @param event Chat-message event to encode.
 * @returns JSON payload ready to publish to Kafka.
 */
export function encodeChatMessageListEvent(
  event: ChatMessageListEvent,
): string {
  const payload: ChatMessageListEventPayload = {
    type: event.type,
    chatMessage: {
      id: event.chatMessage.id,
      chatId: event.chatMessage.chatId,
      author: event.chatMessage.author
        ? encodeUserSummary(event.chatMessage.author)
        : null,
      content: event.chatMessage.content,
      createdAt: event.chatMessage.createdAt.toISOString(),
      updatedAt: event.chatMessage.updatedAt.toISOString(),
    },
    visibleToUserIds: [...event.visibleToUserIds],
  };

  return JSON.stringify(payload);
}

/**
 * Rebuilds one chat-message domain event from a Kafka payload string.
 *
 * @param payload JSON payload consumed from Kafka.
 * @returns Reconstructed chat-message domain event.
 */
export function decodeChatMessageListEvent(
  payload: string,
): ChatMessageListEvent {
  const parsedPayload = JSON.parse(payload) as ChatMessageListEventPayload;

  switch (parsedPayload.type) {
    case 'chat_message.added':
      return ChatMessageListEvent.messageAdded(
        decodeChatMessage(parsedPayload.chatMessage),
        parsedPayload.visibleToUserIds,
      );
  }
}

/**
 * Serializes one user summary for transport through Kafka.
 *
 * @param userSummary Domain user summary to encode.
 * @returns Primitive payload safe to JSON-serialize.
 */
function encodeUserSummary(userSummary: UserSummary): UserSummaryPayload {
  return {
    id: userSummary.id,
    name: userSummary.name,
  };
}

/**
 * Rebuilds one user summary from its primitive Kafka payload.
 *
 * @param payload Primitive user-summary payload.
 * @returns Reconstructed user summary entity.
 */
function decodeUserSummary(payload: UserSummaryPayload): UserSummary {
  return UserSummary.create({
    id: payload.id,
    name: payload.name,
  });
}

/**
 * Rebuilds one last-message preview from its primitive Kafka payload.
 *
 * @param payload Primitive last-message payload.
 * @returns Reconstructed last-message entity.
 */
function decodeChatLastMessage(
  payload: ChatLastMessagePayload,
): ChatLastMessage {
  return ChatLastMessage.create({
    id: payload.id,
    author: payload.author ? decodeUserSummary(payload.author) : null,
    content: payload.content,
    createdAt: new Date(payload.createdAt),
  });
}

/**
 * Rebuilds one chat from its primitive Kafka payload.
 *
 * @param payload Primitive chat payload.
 * @returns Reconstructed chat entity.
 */
function decodeChat(payload: ChatPayload): Chat {
  return Chat.create({
    id: payload.id,
    members: payload.members.map(decodeUserSummary),
    lastMessage: payload.lastMessage
      ? decodeChatLastMessage(payload.lastMessage)
      : null,
  });
}

/**
 * Rebuilds one chat message from its primitive Kafka payload.
 *
 * @param payload Primitive chat-message payload.
 * @returns Reconstructed chat-message entity.
 */
function decodeChatMessage(payload: ChatMessagePayload): ChatMessage {
  return ChatMessage.create({
    id: payload.id,
    chatId: payload.chatId,
    author: payload.author ? decodeUserSummary(payload.author) : null,
    content: payload.content,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
  });
}
