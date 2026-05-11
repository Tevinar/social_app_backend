import { Injectable } from '@nestjs/common';
import postgres from 'postgres';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  CreateRefreshSessionResult,
  CreateRefreshSessionParams,
  type RefreshSessionCreator,
} from '../../application/ports/sessions/refresh-session-creator.port';

/**
 * Name of the unique partial index that allows only one active refresh session
 * per user/device pair.
 */
const ACTIVE_REFRESH_SESSION_UNIQUE_INDEX_NAME =
  'refresh_sessions_active_user_id_device_id_idx';

/**
 * PostgreSQL SQLSTATE code for a unique-constraint violation.
 */
const POSTGRES_UNIQUE_VIOLATION_ERROR_CODE = '23505';

/**
 * Detects whether a database error corresponds to the active refresh-session
 * unique index.
 *
 * @param error Error thrown by the Postgres client.
 * @returns `true` when the error represents an active-session conflict.
 */
function isActiveRefreshSessionConflict(error: unknown): boolean {
  return (
    error instanceof postgres.PostgresError &&
    error.code === POSTGRES_UNIQUE_VIOLATION_ERROR_CODE &&
    error.constraint_name === ACTIVE_REFRESH_SESSION_UNIQUE_INDEX_NAME
  );
}

/**
 * Postgres-backed implementation of the refresh session persistence port.
 *
 * This adapter stores the server-managed refresh session record created during
 * sign-in. Only the hashed refresh token is persisted; the raw token remains
 * outside the database. At most one active session may exist for a given
 * user/device pair at any time.
 */
@Injectable()
export class PostgresRefreshSessionCreator implements RefreshSessionCreator {
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
   * null until the session is explicitly revoked. Expired unreclaimed sessions
   * for the same user/device pair are marked revoked before the new insert is
   * attempted. If an active session still exists, the insert resolves to a
   * stable conflict result.
   *
   * @param params Refresh session data to persist.
   * @returns The outcome of the session-creation attempt.
   */
  async create(
    params: CreateRefreshSessionParams,
  ): Promise<CreateRefreshSessionResult> {
    const { id, userId, deviceId, tokenHash, expiresAt } = params;

    try {
      await this.database.sql.begin(async (sql) => {
        await sql`
          update refresh_sessions
          set revoked_at = now()
          where user_id = ${userId}
            and device_id = ${deviceId}
            and revoked_at is null
            and expires_at <= now()
        `;

        await sql`
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
        `;
      });

      return CreateRefreshSessionResult.CREATED;
    } catch (error: unknown) {
      if (isActiveRefreshSessionConflict(error)) {
        return CreateRefreshSessionResult.ACTIVE_SESSION_CONFLICT;
      }

      throw error;
    }
  }
}
