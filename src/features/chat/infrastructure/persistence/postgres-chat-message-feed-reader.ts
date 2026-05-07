import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  type ChatMessageFeedReader,
  type FindRecentChatMessageFeedSliceParams,
} from '../../application/ports/chat-message-feed-reader.port';
import { ChatMessage } from '../../domain/entities/chat-message';
import { UserSummary } from '../../domain/entities/user-summary';

/**
 * Postgres-backed implementation of the chat-message feed reader port.
 */
@Injectable()
export class PostgresChatMessageFeedReader implements ChatMessageFeedReader {
  /**
   * Receives the shared database service used to query chat-message rows.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Reads one recent slice of messages inside one chat visible to the caller.
   *
   * @param params Cursor window requested by the caller.
   * @returns Current slice of chat messages.
   */
  async findRecentSlice(
    params: FindRecentChatMessageFeedSliceParams,
  ): Promise<ChatMessage[]> {
    const rows = params.cursor
      ? await this.database.sql<ChatMessageRow[]>`
        select
          m.id,
          m.chat_id as "chatId",
          m.author_id as "authorId",
          ap.name as "authorName",
          m.content,
          m.created_at as "createdAt",
          m.updated_at as "updatedAt"
        from chat_messages m
        join chat_members self_membership
          on self_membership.chat_id = m.chat_id
        left join profiles ap
          on ap.user_id = m.author_id
        where self_membership.member_id = ${params.userId}
          and m.chat_id = ${params.chatId}
          and (m.created_at, m.id) < (${params.cursor.createdAt}, ${params.cursor.id})
        order by m.created_at desc, m.id desc
        limit ${params.limit}
      `
      : await this.database.sql<ChatMessageRow[]>`
        select
          m.id,
          m.chat_id as "chatId",
          m.author_id as "authorId",
          ap.name as "authorName",
          m.content,
          m.created_at as "createdAt",
          m.updated_at as "updatedAt"
        from chat_messages m
        join chat_members self_membership
          on self_membership.chat_id = m.chat_id
        left join profiles ap
          on ap.user_id = m.author_id
        where self_membership.member_id = ${params.userId}
          and m.chat_id = ${params.chatId}
        order by m.created_at desc, m.id desc
        limit ${params.limit}
      `;

    return rows.map(mapChatMessageRowToEntity);
  }
}

type ChatMessageRow = {
  id: string;
  chatId: string;
  authorId: string | null;
  authorName: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Maps one raw SQL row into the chat-message domain entity.
 *
 * @param row Raw SQL row returned by the persistence layer.
 * @returns Chat-message entity ready for application use.
 */
function mapChatMessageRowToEntity(row: ChatMessageRow): ChatMessage {
  return ChatMessage.create({
    id: row.id,
    chatId: row.chatId,
    author:
      row.authorId !== null && row.authorName !== null
        ? UserSummary.create({
            id: row.authorId,
            name: row.authorName,
          })
        : null,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
