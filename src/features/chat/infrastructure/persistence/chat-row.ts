import { Chat } from '../../domain/entities/chat';
import { ChatLastMessage } from '../../domain/entities/chat-last-message';
import { UserSummary } from '../../domain/entities/user-summary';

export type ChatRow = {
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
 * Maps one raw SQL chat row into the chat domain entity.
 *
 * @param row Raw SQL row returned by the persistence layer.
 * @param malformedRowLabel Context used in the malformed-row error message.
 * @returns Chat entity ready for application use.
 */
export function mapPersistedChatRowToEntity(
  row: ChatRow,
  malformedRowLabel: string,
): Chat {
  return Chat.create({
    id: row.id,
    members: row.memberIds.map((id, index) => {
      const name = row.memberNames[index];

      if (name === undefined) {
        throw new Error(`${malformedRowLabel} is malformed`);
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
