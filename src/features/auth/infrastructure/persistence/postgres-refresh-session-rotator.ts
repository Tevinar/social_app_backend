import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  type RefreshSessionRotator,
  type RotateRefreshSessionParams,
} from '../../application/ports/sessions/refresh-session-rotator.port';

/**
 * Postgres-backed implementation of the refresh-session rotation port.
 *
 * This adapter replaces the persisted token hash and expiration timestamp
 * after the refresh flow issues a newly rotated refresh token.
 */
@Injectable()
export class PostgresRefreshSessionRotator implements RefreshSessionRotator {
  /**
   * Receives the shared database service used to update refresh sessions.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Persists the newly rotated refresh-token hash and expiration timestamp.
   *
   * @param params Rotation data to persist.
   */
  async rotate(params: RotateRefreshSessionParams): Promise<void> {
    const { id, tokenHash, expiresAt } = params;

    await this.database.sql`
      update refresh_sessions
      set
        token_hash = ${tokenHash},
        expires_at = ${expiresAt},
        revoked_at = null
      where id = ${id}
    `;
  }
}
