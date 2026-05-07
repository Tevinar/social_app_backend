import { Chat } from "../../../domain/entities/chat";
import { ChatMessage } from "../../../domain/entities/chat-message";

export type ChatWriteResult = {
  chat: Chat;
  chatMessage: ChatMessage;
};
