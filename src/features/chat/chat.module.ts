import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { KafkaModule } from '../../core/kafka/kafka.module';
import { AuthModule } from '../auth/auth.module';
import { CHAT_CANDIDATE_READER } from './application/ports/chat-candidate-list-reader.port';
import { CHAT_CREATOR } from './application/ports/chat-creator.port';
import { CHAT_BY_MEMBERS_READER } from './application/ports/chat-by-members-reader.port';
import { CHAT_LIST_READER } from './application/ports/chat-list-reader.port';
import { CHAT_LIST_EVENT_BUS } from './application/ports/chat-list-event-bus.port';
import { CHAT_MESSAGE_CREATOR } from './application/ports/chat-message-creator.port';
import { CHAT_MESSAGE_LIST_READER } from './application/ports/chat-message-list-reader.port';
import { CHAT_MESSAGE_LIST_EVENT_BUS } from './application/ports/chat-message-list-event-bus.port';
import { CreateChatUseCase } from './application/use-cases/create-chat.use-case';
import { CreateChatMessageUseCase } from './application/use-cases/create-chat-message.use-case';
import { GetChatByMembersUseCase } from './application/use-cases/get-chat-by-members.use-case';
import { GetChatCandidateListSliceUseCase } from './application/use-cases/get-chat-candidate-list-slice.use-case';
import { GetChatListSliceUseCase } from './application/use-cases/get-chat-list-slice.use-case';
import { SubscribeToChatMessageListUseCase } from './application/use-cases/subscribe-to-chat-message-list.use-case';
import { KafkaChatListEventBus } from './infrastructure/events/kafka-chat-list-event-bus';
import { KafkaChatMessageListEventBus } from './infrastructure/events/kafka-chat-message-list-event-bus';
import { PostgresChatByMembersReader } from './infrastructure/persistence/postgres-chat-by-members-reader';
import { PostgresChatCandidateListReader } from './infrastructure/persistence/postgres-chat-candidate-reader';
import { PostgresChatCreator } from './infrastructure/persistence/postgres-chat-creator';
import { PostgresChatListReader } from './infrastructure/persistence/postgres-chat-list-reader';
import { PostgresChatMessageCreator } from './infrastructure/persistence/postgres-chat-message-creator';
import { ChatController } from './presentation/chat.controller';
import { GetChatMessageListSliceUseCase } from './application/use-cases/get-chat-message-list-slice.use-case';
import { SubscribeToChatListUseCase } from './application/use-cases/subscribe-to-chat-list.use-case';
import { PostgresChatMessageListReader } from './infrastructure/persistence/postgres-chat-message-list-reader';

/**
 * Feature module that wires the chat slice into Nest's DI graph.
 */
@Module({
  imports: [AuthModule, DatabaseModule, KafkaModule],
  controllers: [ChatController],
  providers: [
    CreateChatUseCase,
    CreateChatMessageUseCase,
    GetChatByMembersUseCase,
    GetChatCandidateListSliceUseCase,
    GetChatListSliceUseCase,
    GetChatMessageListSliceUseCase,
    SubscribeToChatListUseCase,
    SubscribeToChatMessageListUseCase,
    {
      provide: CHAT_CANDIDATE_READER,
      useClass: PostgresChatCandidateListReader,
    },
    {
      provide: CHAT_CREATOR,
      useClass: PostgresChatCreator,
    },
    {
      provide: CHAT_MESSAGE_CREATOR,
      useClass: PostgresChatMessageCreator,
    },
    {
      provide: CHAT_BY_MEMBERS_READER,
      useClass: PostgresChatByMembersReader,
    },
    {
      provide: CHAT_LIST_READER,
      useClass: PostgresChatListReader,
    },
    {
      provide: CHAT_LIST_EVENT_BUS,
      useClass: KafkaChatListEventBus,
    },
    {
      provide: CHAT_MESSAGE_LIST_READER,
      useClass: PostgresChatMessageListReader,
    },
    {
      provide: CHAT_MESSAGE_LIST_EVENT_BUS,
      useClass: KafkaChatMessageListEventBus,
    },
  ],
  exports: [
    CreateChatUseCase,
    CreateChatMessageUseCase,
    GetChatByMembersUseCase,
    GetChatCandidateListSliceUseCase,
    GetChatListSliceUseCase,
    GetChatMessageListSliceUseCase,
    SubscribeToChatListUseCase,
    SubscribeToChatMessageListUseCase,
  ],
})
export class ChatModule {}
