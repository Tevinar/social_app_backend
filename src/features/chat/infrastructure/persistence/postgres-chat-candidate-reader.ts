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
   * Reads one chat-candidate slice ordered alphabetically by profile name.
   *
   * The current implementation lists every user except the caller. Future
   * friendship or visibility restrictions should be added here.
   *
   * @param params Cursor window requested by the caller.
   * @returns Current slice of chat candidates.
   */
  async findSlice(
    params: FindRecentChatCandidatesSliceParams,
  ): Promise<RecentChatCandidatesSlice> {
    const rows = params.cursor
      ? await this.database.sql<ChatCandidateRow[]>`
        select
          u.id,
          p.name
        from users u
        join profiles p on p.user_id = u.id
        where u.id <> ${params.userId}
          and (lower(p.name), u.id) > (${params.cursor.candidateName}, ${params.cursor.id})
        order by lower(p.name) asc, u.id asc
        limit ${params.limit}
      `
      : await this.database.sql<ChatCandidateRow[]>`
        select
          u.id,
          p.name
        from users u
        join profiles p on p.user_id = u.id
        where u.id <> ${params.userId}
        order by lower(p.name) asc, u.id asc
        limit ${params.limit}
      `;

    return {
      items: rows.map(mapChatCandidateRowToEntity),
    };
  }
}
