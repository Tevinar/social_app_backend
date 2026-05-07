import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CHAT_CANDIDATE_READER } from './application/ports/chat-candidate-reader.port';
import { CHAT_CREATOR } from './application/ports/chat-creator.port';
import { CHAT_BY_MEMBERS_READER } from './application/ports/chat-by-members-reader.port';
import { CHAT_FEED_READER } from './application/ports/chat-feed-reader.port';
import { CHAT_FEED_EVENT_BUS } from './application/ports/chat-feed-event-bus.port';
import { CHAT_MESSAGE_FEED_READER } from './application/ports/chat-message-feed-reader.port';
import { CHAT_MESSAGE_EVENT_BUS } from './application/ports/chat-message-event-bus.port';
import { CreateChatUseCase } from './application/use-cases/create-chat.use-case';
import { GetChatByMembersUseCase } from './application/use-cases/get-chat-by-members.use-case';
import { GetChatCandidatesSliceUseCase } from './application/use-cases/get-chat-candidates-slice.use-case';
import { GetChatFeedSliceUseCase } from './application/use-cases/get-chat-feed-slice.use-case';
import { GetChatMessageFeedSliceUseCase } from './application/use-cases/get-chat-message-feed-slice.use-case';
import { SubscribeToChatFeedUseCase } from './application/use-cases/subscribe-to-chat-feed.use-case';
import { SubscribeToChatMessageChangesUseCase } from './application/use-cases/subscribe-to-chat-message-changes.use-case';
import { InMemoryChatFeedEventBus } from './infrastructure/events/in-memory-chat-feed-event-bus';
import { InMemoryChatMessageEventBus } from './infrastructure/events/in-memory-chat-message-event-bus';
import { PostgresChatByMembersReader } from './infrastructure/persistence/postgres-chat-by-members-reader';
import { PostgresChatCandidateReader } from './infrastructure/persistence/postgres-chat-candidate-reader';
import { PostgresChatCreator } from './infrastructure/persistence/postgres-chat-creator';
import { PostgresChatFeedReader } from './infrastructure/persistence/postgres-chat-feed-reader';
import { PostgresChatMessageFeedReader } from './infrastructure/persistence/postgres-chat-message-feed-reader';
import { ChatController } from './presentation/chat.controller';

/**
 * Feature module that wires the chat slice into Nest's DI graph.
 */
@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ChatController],
  providers: [
    CreateChatUseCase,
    GetChatByMembersUseCase,
    GetChatCandidatesSliceUseCase,
    GetChatFeedSliceUseCase,
    GetChatMessageFeedSliceUseCase,
    SubscribeToChatFeedUseCase,
    SubscribeToChatMessageChangesUseCase,
    {
      provide: CHAT_CANDIDATE_READER,
      useClass: PostgresChatCandidateReader,
    },
    {
      provide: CHAT_CREATOR,
      useClass: PostgresChatCreator,
    },
    {
      provide: CHAT_BY_MEMBERS_READER,
      useClass: PostgresChatByMembersReader,
    },
    {
      provide: CHAT_FEED_READER,
      useClass: PostgresChatFeedReader,
    },
    {
      provide: CHAT_FEED_EVENT_BUS,
      useClass: InMemoryChatFeedEventBus,
    },
    {
      provide: CHAT_MESSAGE_FEED_READER,
      useClass: PostgresChatMessageFeedReader,
    },
    {
      provide: CHAT_MESSAGE_EVENT_BUS,
      useClass: InMemoryChatMessageEventBus,
    },
  ],
  exports: [
    CreateChatUseCase,
    GetChatByMembersUseCase,
    GetChatCandidatesSliceUseCase,
    GetChatFeedSliceUseCase,
    GetChatMessageFeedSliceUseCase,
    SubscribeToChatFeedUseCase,
    SubscribeToChatMessageChangesUseCase,
  ],
})
export class ChatModule {}
