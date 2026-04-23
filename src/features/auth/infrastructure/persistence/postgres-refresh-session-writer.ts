import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  CreateRefreshSessionParams,
  type RefreshSessionWriter,
} from '../../application/ports/sessions/refresh-session-writer';

/**
 * Postgres-backed implementation of the refresh session persistence port.
 *
 * This adapter stores the server-managed refresh session record created during
 * sign-in. Only the hashed refresh token is persisted; the raw token remains
 * outside the database. Repeated sign-ins from the same user/device pair
 * replace the previous session row.
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
   * Persists a newly issued refresh session row for one user/device pair.
   *
   * The table supplies default values for `created_at` and leaves `revoked_at`
   * null until the session is explicitly revoked. When the user/device pair
   * already exists, the row is replaced with the newly issued session id and
   * token hash.
   *
   * @param params Refresh session data to persist.
   */
  async create(params: CreateRefreshSessionParams): Promise<void> {
    const { id, userId, deviceId, tokenHash, expiresAt } = params;

    await this.database.sql`
      insert into refresh_sessions (
        id,
        user_id,
        device_id,
        token_hash,
        expires_at
      )
      values (
        ${id},
        ${userId},
        ${deviceId},
        ${tokenHash},
        ${expiresAt}
      )
      on conflict (user_id, device_id)
      do update set
        id = excluded.id,
        token_hash = excluded.token_hash,
        expires_at = excluded.expires_at,
        revoked_at = null,
        created_at = now()
    `;
  }
}
