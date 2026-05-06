import {
  RefreshSession,
  type RefreshSessionUsageAttempt,
} from './refresh-session';

describe('RefreshSession', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const future = new Date('2026-01-01T00:01:00.000Z');
  const past = new Date('2025-12-31T23:59:00.000Z');

  const createParams = (
    override: Partial<{
      id: string;
      userId: string;
      deviceId: string;
      tokenHash: string;
      expiresAt: Date;
      revokedAt: Date | null;
    }> = {},
  ) => ({
    id: 'session-id',
    userId: 'user-id',
    deviceId: 'device-id',
    tokenHash: 'token-hash',
    expiresAt: future,
    revokedAt: null,
    ...override,
  });

  const createAttempt = (
    override: Partial<RefreshSessionUsageAttempt> = {},
  ): RefreshSessionUsageAttempt => ({
    userId: 'user-id',
    deviceId: 'device-id',
    tokenHash: 'token-hash',
    now,
    ...override,
  });

  it('given a persisted session when reading its id then it returns the persisted id', () => {
    const session = RefreshSession.create(
      createParams({ id: 'persisted-session-id' }),
    );

    expect(session.id).toBe('persisted-session-id');
  });

  it('given a matching active session when refreshing then it returns true', () => {
    const session = RefreshSession.create(createParams());

    expect(session.canBeRefreshedWith(createAttempt())).toBe(true);
  });

  it('given a different user when refreshing then it returns false', () => {
    const session = RefreshSession.create(createParams());

    expect(
      session.canBeRefreshedWith(createAttempt({ userId: 'other-user-id' })),
    ).toBe(false);
  });

  it('given a different device when refreshing then it returns false', () => {
    const session = RefreshSession.create(createParams());

    expect(
      session.canBeRefreshedWith(
        createAttempt({ deviceId: 'other-device-id' }),
      ),
    ).toBe(false);
  });

  it('given a different token hash when refreshing then it returns false', () => {
    const session = RefreshSession.create(createParams());

    expect(
      session.canBeRefreshedWith(
        createAttempt({ tokenHash: 'other-token-hash' }),
      ),
    ).toBe(false);
  });

  it('given a revoked session when refreshing then it returns false', () => {
    const session = RefreshSession.create(createParams({ revokedAt: past }));

    expect(session.canBeRefreshedWith(createAttempt())).toBe(false);
  });

  it('given an expired session when refreshing then it returns false', () => {
    const session = RefreshSession.create(createParams({ expiresAt: past }));

    expect(session.canBeRefreshedWith(createAttempt())).toBe(false);
  });

  it('given a session that expires now when refreshing then it returns false', () => {
    const session = RefreshSession.create(createParams({ expiresAt: now }));

    expect(session.canBeRefreshedWith(createAttempt())).toBe(false);
  });

  it('given a matching active session when signing out then it returns true', () => {
    const session = RefreshSession.create(createParams());

    expect(session.canBeSignedOutWith(createAttempt())).toBe(true);
  });

  it('given a non-matching attempt when signing out then it returns false', () => {
    const session = RefreshSession.create(createParams());

    expect(
      session.canBeSignedOutWith(
        createAttempt({ deviceId: 'other-device-id' }),
      ),
    ).toBe(false);
  });

  it('given an inactive session when signing out then it returns false', () => {
    const session = RefreshSession.create(createParams({ revokedAt: past }));

    expect(session.canBeSignedOutWith(createAttempt())).toBe(false);
  });
});
