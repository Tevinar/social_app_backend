import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  CreateRefreshSessionParams,
  type RefreshSessionWriter,
} from '../../application/ports/refresh-session-writer';

/**
 * Postgres-backed implementation of the refresh session persistence port.
 *
 * This adapter stores the server-managed refresh session record created during
 * sign-in. Only the hashed refresh token is persisted; the raw token remains
 * outside the database.
 */
@Injectable()
export class PostgresRefreshSessionWriter implements RefreshSessionWriter {
  /**
   * Receives the shared database service used to insert refresh sessions.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Persists a newly issued refresh session row.
   *
   * The table supplies default values for `created_at` and leaves `revoked_at`
   * null until the session is explicitly revoked.
   *
   * @param params Refresh session data to persist.
   */
  async create(params: CreateRefreshSessionParams): Promise<void> {
    const { id, userId, tokenHash, expiresAt } = params;

    await this.database.sql`
      insert into refresh_sessions (
        id,
        user_id,
        token_hash,
        expires_at
      )
      values (
        ${id},
        ${userId},
        ${tokenHash},
        ${expiresAt}
      )
    `;
  }
}
