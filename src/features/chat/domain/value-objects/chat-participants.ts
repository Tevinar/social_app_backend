/**
 * Value object representing the validated participant set of a new chat.
 */
export class ChatParticipants {
  /**
   * Creates a participant set from normalized identifiers.
   *
   * @param creatorId Authenticated caller creating the chat.
   * @param memberIds Other unique participant ids selected by the caller.
   */
  private constructor(
    readonly creatorId: string,
    readonly memberIds: string[],
  ) {}

  /**
   * Builds one participant set from raw caller input.
   *
   * The creator id and member ids are normalized by trimming surrounding
   * whitespace and lowercasing. Every identifier must be a UUID v4. Duplicate
   * members are removed. If the creator appears in the submitted member list,
   * that duplicate is ignored because the creator is already included
   * implicitly. At least one other participant must remain after
   * normalization.
   *
   * @param rawCreatorId Authenticated caller creating the chat.
   * @param rawMemberIds Other participant ids selected by the caller.
   * @returns Validated participant set ready for persistence.
   * @throws {InvalidChatParticipantIdError} Thrown when one identifier is not a
   * UUID v4.
   * @throws {InvalidChatParticipantsError} Thrown when no other participant
   * remains after normalization.
   */
  static from(rawCreatorId: string, rawMemberIds: string[]): ChatParticipants {
    const creatorId = normalizeChatParticipantId(rawCreatorId);
    const uniqueMemberIds = [...new Set(rawMemberIds)].map(
      normalizeChatParticipantId,
    );

    const otherMemberIds = uniqueMemberIds.filter(
      (memberId) => memberId !== creatorId,
    );

    if (otherMemberIds.length === 0) {
      throw new InvalidChatParticipantsError();
    }

    return new ChatParticipants(creatorId, otherMemberIds);
  }

  /**
   * Returns the full participant set including the creator.
   *
   * @returns Full participant identifiers including the creator.
   */
  get participantIds(): string[] {
    return [this.creatorId, ...this.memberIds];
  }
}

/**
 * Signals that one submitted chat participant identifier is malformed.
 */
export class InvalidChatParticipantIdError extends Error {
  /**
   * Creates a stable validation error for malformed chat participant ids.
   */
  constructor() {
    super('Invalid chat participant id');
  }
}

/**
 * Signals that a chat creation attempt does not include any other participant.
 */
export class InvalidChatParticipantsError extends Error {
  /**
   * Creates a stable validation error for rejected chat participant sets.
   */
  constructor() {
    super('Chat must include at least one other participant');
  }
}

/**
 * Normalizes and validates one raw participant identifier.
 *
 * @param rawId Raw identifier submitted by the caller.
 * @returns Normalized UUID v4 identifier.
 * @throws {InvalidChatParticipantIdError} Thrown when the identifier is not a
 * UUID v4.
 */
function normalizeChatParticipantId(rawId: string): string {
  const normalizedId = rawId.trim().toLowerCase();

  if (!UUID_V4_PATTERN.test(normalizedId)) {
    throw new InvalidChatParticipantIdError();
  }

  return normalizedId;
}

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
