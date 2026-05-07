/**
 * Value object representing the validated member set of a new chat.
 */
export class ChatMembers {
  /**
   * Creates a member set from normalized identifiers.
   *
   * @param creatorId Authenticated caller creating the chat.
   * @param otherMemberIds Other unique member ids selected by the caller.
   */
  private constructor(
    readonly creatorId: string,
    readonly otherMemberIds: string[],
  ) {}

  /**
   * Builds one member set from raw caller input.
   *
   * The creator id and member ids are normalized by trimming surrounding
   * whitespace and lowercasing. Every identifier must be a UUID v4. Duplicate
   * members are removed. If the creator appears in the submitted member list,
   * that duplicate is ignored because the creator is already included
   * implicitly. At least one other member must remain after normalization.
   *
   * @param rawCreatorId Authenticated caller creating the chat.
   * @param rawMemberIds Other member ids selected by the caller.
   * @returns Validated member set ready for persistence.
   * @throws {InvalidChatMemberIdError} Thrown when one identifier is not a UUID
   * v4.
   * @throws {InvalidChatMembersError} Thrown when no other member remains after
   * normalization.
   */
  static from(rawCreatorId: string, rawMemberIds: string[]): ChatMembers {
    const creatorId = normalizeChatMemberId(rawCreatorId);
    const uniqueMemberIds = [...new Set(rawMemberIds)].map(
      normalizeChatMemberId,
    );

    const otherMemberIds = uniqueMemberIds.filter(
      (memberId) => memberId !== creatorId,
    );

    if (otherMemberIds.length === 0) {
      throw new InvalidChatMembersError();
    }

    return new ChatMembers(creatorId, otherMemberIds);
  }

  /**
   * Returns the full member set including the creator.
   *
   * @returns Full member identifiers including the creator.
   */
  get memberIds(): string[] {
    return [this.creatorId, ...this.otherMemberIds];
  }
}

/**
 * Signals that one submitted chat member identifier is malformed.
 */
export class InvalidChatMemberIdError extends Error {
  /**
   * Creates a stable validation error for malformed chat member ids.
   */
  constructor() {
    super('Invalid chat member id');
  }
}

/**
 * Signals that a chat creation attempt does not include any other member.
 */
export class InvalidChatMembersError extends Error {
  /**
   * Creates a stable validation error for rejected chat member sets.
   */
  constructor() {
    super('Chat must include at least one other member');
  }
}

/**
 * Normalizes and validates one raw member identifier.
 *
 * @param rawId Raw identifier submitted by the caller.
 * @returns Normalized UUID v4 identifier.
 * @throws {InvalidChatMemberIdError} Thrown when the identifier is not a UUID
 * v4.
 */
function normalizeChatMemberId(rawId: string): string {
  const normalizedId = rawId.trim().toLowerCase();

  if (!UUID_V4_PATTERN.test(normalizedId)) {
    throw new InvalidChatMemberIdError();
  }

  return normalizedId;
}

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
