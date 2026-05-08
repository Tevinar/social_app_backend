import { GetChatResponse } from '../common/get-chat.response';

import { ChatWriteResult } from '../../../../application/use-cases/results/chat-write.result';
import { GetChatMessageResponse } from '../common/get-chat-message.response';

export class ChatWriteResponse {
  chat!: GetChatResponse;
  chatMessage!: GetChatMessageResponse;

  static fromChatWriteResult(result: ChatWriteResult): ChatWriteResponse {
    return {
      chat: GetChatResponse.fromChat(result.chat),
      chatMessage: GetChatMessageResponse.fromChatMessage(result.chatMessage),
    };
  }
}
