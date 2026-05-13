import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { type ChatByMembersReader } from '../../application/ports/chat-by-members-reader.port';
import { Chat } from '../../domain/entities/chat';
import { ChatRow, mapPersistedChatRowToEntity } from './chat-row';

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
        select
          c.id,
          c.last_message_id,
          c.last_message_at
        from chats c
        join chat_members cm
          on cm.chat_id = c.id
        group by
          c.id,
          c.last_message_id,
          c.last_message_at
        having array_agg(cm.member_id order by cm.member_id) = ${memberIds}::uuid[]
        limit 1
      )
      select
        mc.id as id,
        array_agg(cm.member_id order by lower(p.name), cm.member_id) as "memberIds",
        array_agg(p.name order by lower(p.name), cm.member_id) as "memberNames",
        lm.id as "lastMessageId",
        lm.author_id as "lastMessageAuthorId",
        ap.name as "lastMessageAuthorName",
        lm.content as "lastMessageContent",
        lm.created_at as "lastMessageCreatedAt"
      from matching_chat mc
      join chat_members cm
        on cm.chat_id = mc.id
      join profiles p
        on p.user_id = cm.member_id
      left join chat_messages lm
        on lm.id = mc.last_message_id
       and lm.chat_id = mc.id
      left join profiles ap
        on ap.user_id = lm.author_id
      group by
        mc.id,
        lm.id,
        lm.author_id,
        ap.name,
        lm.content,
        lm.created_at
    `;

    const row = rows[0];

    if (!row) {
      return null;
    }

    return mapPersistedChatRowToEntity(row, 'Chat row');
  }
}
