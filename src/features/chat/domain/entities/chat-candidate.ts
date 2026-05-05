/**
 * Persisted chat-candidate state required to build one candidate slice.
 */
export type ChatCandidateSnapshot = {
  id: string;
  name: string;
  createdAt: Date;
};

/**
 * Domain entity representing one user currently eligible to appear in the
 * "start chat" candidate list.
 */
export class ChatCandidate {
  /**
   * Rehydrates one chat candidate from persisted state.
   *
   * @param snapshot Persisted chat-candidate data.
   * @returns A chat-candidate domain entity.
   */
  static fromSnapshot(snapshot: ChatCandidateSnapshot): ChatCandidate {
    return new ChatCandidate(snapshot);
  }

  /**
   * Stores the immutable candidate snapshot used by application reads.
   *
   * @param snapshot Persisted chat-candidate data.
   */
  private constructor(private readonly snapshot: ChatCandidateSnapshot) {}

  /**
   * Stable candidate identifier.
   */
  get id(): string {
    return this.snapshot.id;
  }

  /**
   * Public candidate display name.
   */
  get name(): string {
    return this.snapshot.name;
  }

  /**
   * Candidate creation timestamp used by cursor pagination.
   */
  get createdAt(): Date {
    return this.snapshot.createdAt;
  }
}
