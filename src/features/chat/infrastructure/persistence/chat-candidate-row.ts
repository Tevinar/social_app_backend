import { UserSummary } from '../../domain/entities/user-summary';

/**
 * Row shape returned by the chat-candidate SQL queries.
 */
export type ChatCandidateRow = {
  id: string;
  name: string;
};

/**
 * Maps one raw SQL row into the chat-candidate domain entity.
 *
 * @param row Raw SQL row returned by the persistence layer.
 * @returns Chat-candidate entity ready for application use.
 */
export function mapChatCandidateRowToEntity(
  row: ChatCandidateRow,
): UserSummary {
  return UserSummary.create({
    id: row.id,
    name: row.name,
  });
}
