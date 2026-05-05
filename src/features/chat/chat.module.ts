import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CHAT_CANDIDATE_READER } from './application/ports/chat-candidate-reader.port';
import { GetChatCandidatesSliceUseCase } from './application/use-cases/get-chat-candidates-slice.use-case';
import { PostgresChatCandidateReader } from './infrastructure/persistence/postgres-chat-candidate-reader';
import { ChatController } from './presentation/chat.controller';

/**
 * Feature module that wires the chat slice into Nest's DI graph.
 */
@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ChatController],
  providers: [
    GetChatCandidatesSliceUseCase,
    {
      provide: CHAT_CANDIDATE_READER,
      useClass: PostgresChatCandidateReader,
    },
  ],
  exports: [GetChatCandidatesSliceUseCase],
})
export class ChatModule {}
