import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  CreateChatMessageRecordResultType,
  type ChatMessageCreator,
  type CreateChatMessageRecordParams,
  type CreateChatMessageRecordResult,
} from '../../application/ports/chat-message-creator.port';
import { Chat } from '../../domain/entities/chat';
import { ChatLastMessage } from '../../domain/entities/chat-last-message';
import { ChatMessage } from '../../domain/entities/chat-message';
import { UserSummary } from '../../domain/entities/user-summary';

/**
 * Postgres-backed implementation of the chat-message creator port.
 */
@Injectable()
export class PostgresChatMessageCreator implements ChatMessageCreator {
  /**
   * Receives the shared database service used to create chat messages
   * transactionally.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Persists one new message and the resulting chat-feed update in one
   * transaction.
   *
   * @param params Chat-message creation data to persist.
   * @returns Stable application-level creation outcome.
   */
  async create(
    params: CreateChatMessageRecordParams,
  ): Promise<CreateChatMessageRecordResult> {
    return this.database.sql.begin(async (sql) => {
      // Ensure the target chat exists and the caller belongs to it before
      // writing a new message.
      const membershipRows = await sql<{ exists: boolean }[]>`
        select true as exists
        from chat_members
        where chat_id = ${params.chatId}
          and member_id = ${params.authorId}
        limit 1
      `;

      if (!membershipRows[0]?.exists) {
        return {
          type: CreateChatMessageRecordResultType.CHAT_NOT_FOUND,
        };
      }

      // Insert the new message into the target chat.
      const messageRows = await sql<
        {
          id: string;
          createdAt: Date;
          updatedAt: Date;
        }[]
      >`
        insert into chat_messages (
          chat_id,
          author_id,
          content
        )
        values (
          ${params.chatId},
          ${params.authorId},
          ${params.content}
        )
        returning
          id,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const createdMessage = messageRows[0];

      if (!createdMessage) {
        throw new Error('Chat message creation failed');
      }

      // Point the chat at its newest message for feed ordering and previews.
      await sql`
        update chats
        set
          last_message_id = ${createdMessage.id},
          last_message_at = ${createdMessage.createdAt}
        where id = ${params.chatId}
      `;

      // Load member display data so the transaction can return hydrated
      // message and feed payloads without an extra roundtrip.
      const memberRows = await sql<
        {
          id: string;
          name: string;
        }[]
      >`
        select
          p.user_id as id,
          p.name
        from chat_members cm
        join profiles p
          on p.user_id = cm.member_id
        where cm.chat_id = ${params.chatId}
        order by lower(p.name) asc, p.user_id asc
      `;

      const members = memberRows.map((row) =>
        UserSummary.create({
          id: row.id,
          name: row.name,
        }),
      );
      const author = members.find((member) => member.id === params.authorId);

      if (!author) {
        throw new Error('Chat message creation failed');
      }

      const chatMessage = ChatMessage.create({
        id: createdMessage.id,
        chatId: params.chatId,
        author,
        content: params.content,
        createdAt: createdMessage.createdAt,
        updatedAt: createdMessage.updatedAt,
      });

      return {
        type: CreateChatMessageRecordResultType.CREATED,
        chat: Chat.create({
          id: params.chatId,
          members,
          lastMessage: ChatLastMessage.create({
            id: createdMessage.id,
            author,
            content: params.content,
            createdAt: createdMessage.createdAt,
          }),
        }),
        chatMessage,
      };
    });
  }
}
