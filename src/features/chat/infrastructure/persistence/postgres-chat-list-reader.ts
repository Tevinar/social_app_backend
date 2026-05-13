import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  type ChatListReader,
  type FindRecentChatListSliceParams,
  type RecentChatListSlice,
} from '../../application/ports/chat-list-reader.port';
import { ChatRow, mapPersistedChatRowToEntity } from './chat-row';

/**
 * Postgres-backed implementation of the chat-list reader port.
 */
@Injectable()
export class PostgresChatListReader implements ChatListReader {
  /**
   * Receives the shared database service used to query chat-list rows.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Reads one recent slice of chats ordered from most recent activity to least
   * recent activity for the caller.
   *
   * @param params Cursor window requested by the caller.
   * @returns Current slice of chat-list items.
   */
  async findRecentSlice(
    params: FindRecentChatListSliceParams,
  ): Promise<RecentChatListSlice> {
    const rows = params.cursor
      ? await this.database.sql<ChatRow[]>`
        with visible_chats as (
          select
            c.id,
            c.last_message_id,
            c.last_message_at
          from chats c
          join chat_members
            on chat_members.chat_id = c.id
          where chat_members.member_id = ${params.userId}
            and (c.last_message_at, c.id) < (${params.cursor.lastMessageAt}, ${params.cursor.id})
          order by c.last_message_at desc, c.id desc
          limit ${params.limit}
        ),
        ${this.chatListTail()}
      `
      : await this.database.sql<ChatRow[]>`
        with visible_chats as (
          select
            c.id,
            c.last_message_id,
            c.last_message_at
          from chats c
          join chat_members self_membership
            on self_membership.chat_id = c.id
          where self_membership.member_id = ${params.userId}
          order by c.last_message_at desc, c.id desc
          limit ${params.limit}
        ),
        ${this.chatListTail()}
      `;

    return {
      items: rows.map((row) =>
        mapPersistedChatRowToEntity(row, 'Chat list row'),
      ),
    };
  }

  /**
   * Returns the shared SQL fragment that hydrates aggregated member data and
   * the latest-message preview for the previously selected visible chats.
   *
   * @returns Shared SQL fragment appended after the `visible_chats` CTE.
   */
  private chatListTail() {
    return this.database.sql`
      chat_members_view as (
        select
          c.id,
          c.last_message_id,
          c.last_message_at,
          array_agg(cm.member_id order by lower(p.name), cm.member_id) as "memberIds",
          array_agg(p.name order by lower(p.name), cm.member_id) as "memberNames"
        from visible_chats c
        join chat_members cm
          on cm.chat_id = c.id
        join profiles p
          on p.user_id = cm.member_id
        group by
          c.id,
          c.last_message_id,
          c.last_message_at
      )
      select
        cmv.id,
        cmv."memberIds",
        cmv."memberNames",
        lm.id as "lastMessageId",
        lm.author_id as "lastMessageAuthorId",
        ap.name as "lastMessageAuthorName",
        lm.content as "lastMessageContent",
        lm.created_at as "lastMessageCreatedAt"
      from chat_members_view cmv
      left join chat_messages lm
        on lm.id = cmv.last_message_id
       and lm.chat_id = cmv.id
      left join profiles ap
        on ap.user_id = lm.author_id
      order by cmv.last_message_at desc, cmv.id desc
    `;
  }
}
