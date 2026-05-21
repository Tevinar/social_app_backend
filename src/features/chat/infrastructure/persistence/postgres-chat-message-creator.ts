import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { insertOutboxEvent } from '../../../../core/outbox/insert-outbox-event';
import {
  CreateChatMessageRecordResultType,
  type ChatMessageCreator,
  type CreateChatMessageRecordParams,
  type CreateChatMessageRecordResult,
} from '../../application/ports/chat-message-creator.port';
import { Chat } from '../../domain/entities/chat';
import { ChatLastMessage } from '../../domain/entities/chat-last-message';
import { ChatMessage } from '../../domain/entities/chat-message';
import { ChatListEvent } from '../../domain/events/chat-list.event';
import { ChatMessageListEvent } from '../../domain/events/chat-message-list.event';
import { UserSummary } from '../../domain/entities/user-summary';
import {
  encodeChatListEvent,
  encodeChatMessageListEvent,
} from '../events/kafka-chat-event.codec';
import {
  CHAT_KAFKA_LIST_TOPIC,
  CHAT_KAFKA_MESSAGE_LIST_TOPIC,
} from '../events/chat-kafka-topics';

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
   * Persists one new message and the resulting chat-list update in one
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

      // Point the chat at its newest message for list ordering and previews.
      await sql`
        update chats
        set
          last_message_id = ${createdMessage.id},
          last_message_at = ${createdMessage.createdAt}
        where id = ${params.chatId}
      `;

      // Load member display data so the transaction can return hydrated
      // message and list payloads without an extra roundtrip.
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
      const chat = Chat.create({
        id: params.chatId,
        members,
        lastMessage: ChatLastMessage.create({
          id: createdMessage.id,
          author,
          content: params.content,
          createdAt: createdMessage.createdAt,
        }),
      });
      const chatListEvent = ChatListEvent.chatUpdated(chat);
      const chatMessageEvent = ChatMessageListEvent.messageAdded(
        chatMessage,
        chat.members.map((member) => member.id),
      );

      await insertOutboxEvent(sql, {
        id: randomUUID(),
        aggregateType: 'chat',
        aggregateId: chat.id,
        eventType: chatListEvent.type,
        topic: CHAT_KAFKA_LIST_TOPIC,
        messageKey: chat.id,
        payload: encodeChatListEvent(chatListEvent),
      });

      await insertOutboxEvent(sql, {
        id: randomUUID(),
        aggregateType: 'chat_message',
        aggregateId: chatMessage.id,
        eventType: chatMessageEvent.type,
        topic: CHAT_KAFKA_MESSAGE_LIST_TOPIC,
        messageKey: chatMessage.chatId,
        payload: encodeChatMessageListEvent(chatMessageEvent),
      });

      return {
        type: CreateChatMessageRecordResultType.CREATED,
        chat,
        chatMessage,
      };
    });
  }
}
