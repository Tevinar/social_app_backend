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
   * whitespace and lowercasing. Duplicate members are removed. If the creator
   * appears in the submitted member list, that duplicate is ignored because the
   * creator is already included implicitly.
   *
   * @param rawCreatorId Authenticated caller creating the chat.
   * @param rawMemberIds Other participant ids selected by the caller.
   * @returns Validated participant set ready for persistence.
   * @throws {InvalidChatParticipantIdError} Thrown when one identifier is not
   * a UUID v4.
   * @throws {InvalidChatParticipantsError} Thrown when no other participant
   * remains after normalization.
   */
  static from(rawCreatorId: string, rawMemberIds: string[]): ChatParticipants {
    const uniqueMemberIds = [...new Set(rawMemberIds)].filter(
      (memberId) => memberId !== rawCreatorId,
    );

    if (uniqueMemberIds.length === 0) {
      throw new InvalidChatParticipantsError();
    }

    return new ChatParticipants(rawCreatorId, uniqueMemberIds);
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
