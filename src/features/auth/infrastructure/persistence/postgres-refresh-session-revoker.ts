import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  type RefreshSessionRevoker,
  type RevokeRefreshSessionParams,
} from '../../application/ports/sessions/refresh-session-revoker.port';

/**
 * Postgres-backed implementation of the refresh-session revocation port.
 *
 * This adapter marks the targeted refresh session as revoked so future refresh
 * attempts against the same session are rejected.
 */
@Injectable()
export class PostgresRefreshSessionRevoker implements RefreshSessionRevoker {
  /**
   * Receives the shared database service used to update refresh sessions.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Persists the revocation timestamp for the targeted refresh session.
   *
   * @param params Revocation data to persist.
   */
  async revoke(params: RevokeRefreshSessionParams): Promise<void> {
    const { id, revokedAt } = params;

    await this.database.sql`
      update refresh_sessions
      set revoked_at = ${revokedAt}
      where id = ${id}
    `;
  }
}
