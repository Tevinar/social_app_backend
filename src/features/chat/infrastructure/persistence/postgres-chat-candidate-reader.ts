import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  type ChatCandidateListReader,
  type FindRecentChatCandidateListSliceParams,
  type RecentChatCandidateListSlice,
} from '../../application/ports/chat-candidate-list-reader.port';
import { UserSummary } from '../../domain/entities/user-summary';

/**
 * Postgres-backed implementation of the chat-candidate list reader port.
 */
@Injectable()
export class PostgresChatCandidateListReader implements ChatCandidateListReader {
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
   * @returns Current slice of chat candidate list.
   */
  async findSlice(
    params: FindRecentChatCandidateListSliceParams,
  ): Promise<RecentChatCandidateListSlice> {
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

type ChatCandidateRow = {
  id: string;
  name: string;
};

/**
 * Maps one raw SQL row into the chat-candidate list domain entity.
 *
 * @param row Raw SQL row returned by the persistence layer.
 * @returns Chat-candidate list entity ready for application use.
 */
function mapChatCandidateRowToEntity(row: ChatCandidateRow): UserSummary {
  return UserSummary.create({
    id: row.id,
    name: row.name,
  });
}
