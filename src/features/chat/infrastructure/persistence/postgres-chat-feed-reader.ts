import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  type ChatFeedReader,
  type FindRecentChatFeedSliceParams,
  type RecentChatFeedSlice,
} from '../../application/ports/chat-feed-reader.port';
import { Chat } from '../../domain/entities/chat';
import { ChatLastMessage } from '../../domain/entities/chat-last-message';
import { UserSummary } from '../../domain/entities/user-summary';

/**
 * Postgres-backed implementation of the chat-feed reader port.
 */
@Injectable()
export class PostgresChatFeedReader implements ChatFeedReader {
  /**
   * Receives the shared database service used to query chat-feed rows.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Reads one recent slice of chats ordered from most recent activity to least
   * recent activity for the caller.
   *
   * @param params Cursor window requested by the caller.
   * @returns Current slice of chat-feed items.
   */
  async findRecentSlice(
    params: FindRecentChatFeedSliceParams,
  ): Promise<RecentChatFeedSlice> {
    const rows = params.cursor
      ? await this.database.sql<ChatFeedRow[]>`
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
        ${this.chatFeedTail()}
      `
      : await this.database.sql<ChatFeedRow[]>`
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
        ${this.chatFeedTail()}
      `;

    return {
      items: rows.map(mapChatFeedRowToEntity),
    };
  }

  /**
   * Returns the shared SQL fragment that hydrates aggregated member data and
   * the latest-message preview for the previously selected visible chats.
   *
   * @returns Shared SQL fragment appended after the `visible_chats` CTE.
   */
  private chatFeedTail() {
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

/**
 * Row shape returned by the chat-feed SQL queries after aliases are applied.
 */
type ChatFeedRow = {
  id: string;
  memberIds: string[];
  memberNames: string[];
  lastMessageId: string | null;
  lastMessageAuthorId: string | null;
  lastMessageAuthorName: string | null;
  lastMessageContent: string | null;
  lastMessageCreatedAt: Date | null;
};

/**
 * Maps one raw SQL row into the chat-feed domain entity.
 *
 * @param row Raw SQL row returned by the persistence layer.
 * @returns Chat-feed entity ready for application use.
 */
function mapChatFeedRowToEntity(row: ChatFeedRow): Chat {
  return Chat.create({
    id: row.id,
    members: row.memberIds.map((id, index) => {
      const name = row.memberNames[index];

      if (name === undefined) {
        throw new Error('Chat feed row is malformed');
      }

      return UserSummary.create({
        id,
        name,
      });
    }),
    lastMessage:
      row.lastMessageId !== null &&
      row.lastMessageContent !== null &&
      row.lastMessageCreatedAt !== null
        ? ChatLastMessage.create({
            id: row.lastMessageId,
            author:
              row.lastMessageAuthorId !== null &&
              row.lastMessageAuthorName !== null
                ? UserSummary.create({
                    id: row.lastMessageAuthorId,
                    name: row.lastMessageAuthorName,
                  })
                : null,
            content: row.lastMessageContent,
            createdAt: row.lastMessageCreatedAt,
          })
        : null,
  });
}
