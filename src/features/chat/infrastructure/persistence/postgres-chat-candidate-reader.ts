import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  type ChatCandidateReader,
  type FindRecentChatCandidatesSliceParams,
  type RecentChatCandidatesSlice,
} from '../../application/ports/chat-candidate-reader.port';
import {
  ChatCandidateRow,
  mapChatCandidateRowToEntity,
} from './chat-candidate-row';

/**
 * Postgres-backed implementation of the chat-candidate reader port.
 */
@Injectable()
export class PostgresChatCandidateReader implements ChatCandidateReader {
  /**
   * Receives the shared database service used to query chat candidates.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Reads one recent slice of chat candidates ordered from most recent to least
   * recent.
   *
   * The current implementation lists every user except the caller. Future
   * friendship or visibility restrictions should be added here.
   *
   * @param params Cursor window requested by the caller.
   * @returns Current slice of chat candidates.
   */
  async findRecentSlice(
    params: FindRecentChatCandidatesSliceParams,
  ): Promise<RecentChatCandidatesSlice> {
    const rows = params.cursor
      ? await this.database.sql<ChatCandidateRow[]>`
        select
          u.id,
          u.name,
          u.created_at as "createdAt"
        from users u
        where u.id <> ${params.userId}
          and (u.created_at, u.id) < (${params.cursor.createdAt}, ${params.cursor.id})
        order by u.created_at desc, u.id desc
        limit ${params.limit}
      `
      : await this.database.sql<ChatCandidateRow[]>`
        select
          u.id,
          u.name,
          u.created_at as "createdAt"
        from users u
        where u.id <> ${params.userId}
        order by u.created_at desc, u.id desc
        limit ${params.limit}
      `;

    return {
      items: rows.map(mapChatCandidateRowToEntity),
    };
  }
}
