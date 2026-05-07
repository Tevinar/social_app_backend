import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { type ChatByMembersReader } from '../../application/ports/chat-by-members-reader.port';
import { Chat } from '../../domain/entities/chat';
import { UserSummary } from '../../domain/entities/user-summary';

/**
 * Postgres-backed implementation of the exact-chat lookup port.
 */
@Injectable()
export class PostgresChatByMembersReader implements ChatByMembersReader {
  /**
   * Receives the shared database service used to query chats by member
   * set.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Reads one existing chat matching the submitted exact member set.
   *
   * @param memberIds Validated full member set for the lookup.
   * @returns Matching chat when one exists, otherwise null.
   */
  async findByMemberIds(memberIds: string[]): Promise<Chat | null> {
    const rows = await this.database.sql<ChatRow[]>`
      with matching_chat as (
        select cm.chat_id
        from chat_members cm
        group by cm.chat_id
        having array_agg(cm.member_id order by cm.member_id) = ${memberIds}::uuid[]
        limit 1
      )
      select
        mc.chat_id as "chatId",
        array_agg(cm.member_id order by lower(p.name), cm.member_id) as "memberIds",
        array_agg(p.name order by lower(p.name), cm.member_id) as "memberNames"
      from matching_chat mc
      join chat_members cm
        on cm.chat_id = mc.chat_id
      join profiles p
        on p.user_id = cm.member_id
      group by mc.chat_id
    `;

    const row = rows[0];

    if (!row) {
      return null;
    }

    return mapChatRowToEntity(row);
  }
}

type ChatRow = {
  chatId: string;
  memberIds: string[];
  memberNames: string[];
};

/**
 * Maps one raw SQL row into the chat domain entity.
 *
 * @param row Raw SQL row returned by the persistence layer.
 * @returns Chat entity ready for application use.
 */
function mapChatRowToEntity(row: ChatRow): Chat {
  return Chat.create({
    id: row.chatId,
    members: row.memberIds.map((id, index) => {
      const name = row.memberNames[index];

      if (name === undefined) {
        throw new Error('Chat row is malformed');
      }

      return UserSummary.create({
        id,
        name,
      });
    }),
  });
}
