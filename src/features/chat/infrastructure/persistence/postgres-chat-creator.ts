import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { insertOutboxEvent } from '../../../../core/outbox/insert-outbox-event';
import {
  CreateChatRecordResultType,
  type ChatCreator,
  type CreateChatRecordParams,
  type CreateChatRecordResult,
} from '../../application/ports/chat-creator.port';
import { Chat } from '../../domain/entities/chat';
import { ChatLastMessage } from '../../domain/entities/chat-last-message';
import { ChatMessage } from '../../domain/entities/chat-message';
import { ChatListEvent } from '../../domain/events/chat-list.event';
import { ChatMessageListEvent } from '../../domain/events/chat-message-list.event';
import { UserSummary } from '../../domain/entities/user-summary';
import {
  encodeChatListEvent,
  encodeChatMessageListEvent,
} from '../events/chat-realtime-event.codec';
import {
  CHAT_LIST_REALTIME_TOPIC,
  CHAT_MESSAGE_LIST_REALTIME_TOPIC,
} from '../events/chat-realtime-topics';

/**
 * Postgres-backed implementation of the chat creator port.
 */
@Injectable()
export class PostgresChatCreator implements ChatCreator {
  /**
   * Receives the shared database service used to create chats transactionally.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Persists one new chat, its members, and the first message in one
   * transaction.
   *
   * @param params Chat creation data to persist.
   * @returns Stable application-level creation outcome.
   */
  async create(
    params: CreateChatRecordParams,
  ): Promise<CreateChatRecordResult> {
    return this.database.sql.begin(async (sql) => {
      // Ensure every requested member exists before creating any chat data.
      const memberRows = await sql<{ count: number }[]>`
        select count(*)::int as count
        from users
        where id = any(${params.memberIds}::uuid[])
      `;

      const memberCount = memberRows[0]?.count ?? 0;

      if (memberCount !== params.memberIds.length) {
        return {
          type: CreateChatRecordResultType.MEMBER_NOT_FOUND,
        };
      }

      // Create the chat shell first so memberships and the first message can
      // reference it.
      const chatRows = await sql<{ id: string }[]>`
        insert into chats default values
        returning id
      `;

      const chatId = chatRows[0]?.id;

      if (!chatId) {
        throw new Error('Chat creation failed');
      }

      // Persist the full membership set for the newly created chat.
      // unnset is used to expand the member ID array into a rowset so that
      // a single insert statement can create all memberships in one go.
      await sql`
        insert into chat_members (
          chat_id,
          member_id
        )
        select
          ${chatId},
          member_id
        from unnest(${params.memberIds}::uuid[]) as member_id
      `;

      // Insert the first message that bootstraps the chat conversation.
      const messageRows = await sql<{ id: string; createdAt: Date }[]>`
        insert into chat_messages (
          chat_id,
          author_id,
          content
        )
        values (
          ${chatId},
          ${params.firstMessageAuthorId},
          ${params.firstMessageContent}
        )
        returning
          id,
          created_at as "createdAt"
      `;

      const firstMessage = messageRows[0];

      if (!firstMessage) {
        throw new Error('Chat creation failed');
      }

      // Load member display data so the transaction can return hydrated
      // realtime payloads without a second roundtrip.
      const memberProfileRows = await sql<
        {
          id: string;
          name: string;
        }[]
      >`
        select
          p.user_id as id,
          p.name
        from profiles p
        where p.user_id = any(${params.memberIds}::uuid[])
        order by lower(p.name) asc, p.user_id asc
      `;

      if (memberProfileRows.length !== params.memberIds.length) {
        throw new Error('Chat creation failed');
      }

      // Point the chat at its current last message for list ordering and
      // previews.
      await sql`
        update chats
        set
          last_message_id = ${firstMessage.id},
          last_message_at = ${firstMessage.createdAt}
        where id = ${chatId}
      `;

      const members = memberProfileRows.map((row) =>
        UserSummary.create({
          id: row.id,
          name: row.name,
        }),
      );
      const author = members.find(
        (member) => member.id === params.firstMessageAuthorId,
      );

      if (!author) {
        throw new Error('Chat creation failed');
      }

      const firstMessageEntity = ChatMessage.create({
        id: firstMessage.id,
        chatId,
        author,
        content: params.firstMessageContent,
        createdAt: firstMessage.createdAt,
        updatedAt: firstMessage.createdAt,
      });
      const chat = Chat.create({
        id: chatId,
        members,
        lastMessage: ChatLastMessage.create({
          id: firstMessage.id,
          author,
          content: params.firstMessageContent,
          createdAt: firstMessage.createdAt,
        }),
      });
      const chatListEvent = ChatListEvent.chatAdded(chat);
      const chatMessageEvent = ChatMessageListEvent.messageAdded(
        firstMessageEntity,
        chat.members.map((member) => member.id),
      );

      await insertOutboxEvent(sql, {
        id: randomUUID(),
        aggregateType: 'chat',
        aggregateId: chat.id,
        eventType: chatListEvent.type,
        topic: CHAT_LIST_REALTIME_TOPIC,
        messageKey: chat.id,
        payload: encodeChatListEvent(chatListEvent),
      });

      await insertOutboxEvent(sql, {
        id: randomUUID(),
        aggregateType: 'chat_message',
        aggregateId: firstMessageEntity.id,
        eventType: chatMessageEvent.type,
        topic: CHAT_MESSAGE_LIST_REALTIME_TOPIC,
        messageKey: firstMessageEntity.chatId,
        payload: encodeChatMessageListEvent(chatMessageEvent),
      });

      return {
        type: CreateChatRecordResultType.CREATED,
        chat,
        firstMessage: firstMessageEntity,
      };
    });
  }
}
