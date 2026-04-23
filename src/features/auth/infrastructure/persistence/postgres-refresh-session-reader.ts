import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  type RefreshSessionReadModel,
  type RefreshSessionReader,
} from '../../application/ports/sessions/refresh-session-reader';

/**
 * Row shape returned by the refresh-session lookup query after SQL column
 * aliases are applied.
 */
type RefreshSessionRow = {
  id: string;
  userId: string;
  deviceId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

/**
 * Postgres-backed implementation of the refresh-session reader port.
 *
 * This adapter loads the persisted session state required by the refresh flow
 * to verify token ownership, expiration, and revocation.
 */
@Injectable()
export class PostgresRefreshSessionReader implements RefreshSessionReader {
  /**
   * Receives the shared database service used to query refresh sessions.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Finds a refresh session by its stable server-side identifier.
   *
   * @param id Refresh session identifier extracted from the token.
   * @returns The matching refresh session projection, or `null` when none
   * exists.
   */
  async findById(id: string): Promise<RefreshSessionReadModel | null> {
    const rows = await this.database.sql<RefreshSessionRow[]>`
      select
        id,
        user_id as "userId",
        device_id as "deviceId",
        token_hash as "tokenHash",
        expires_at as "expiresAt",
        revoked_at as "revokedAt"
      from refresh_sessions
      where id = ${id}
      limit 1
    `;

    return rows[0] ?? null;
  }
}
