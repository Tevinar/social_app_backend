import { Injectable } from '@nestjs/common';
import postgres from 'postgres';
import { DatabaseService } from '../../../../core/database/database.service';
import {
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
 * user/device pair at any time, and a new same-device sign-in rotates the old
 * session away.
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
   * null until the session is explicitly revoked. Any active session for the
   * same user/device pair is revoked before the new insert is attempted. If a
   * concurrent write races with this operation, the write is retried once so
   * the latest sign-in wins for the device.
   *
   * @param params Refresh session data to persist.
   */
  async create(params: CreateRefreshSessionParams): Promise<void> {
    const { id, userId, deviceId, tokenHash, expiresAt } = params;

    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
      try {
        await this.database.sql.begin(async (sql) => {
          await sql`
            update refresh_sessions
            set revoked_at = now()
            where user_id = ${userId}
              and device_id = ${deviceId}
              and revoked_at is null
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

        return;
      } catch (error: unknown) {
        if (
          isActiveRefreshSessionConflict(error) &&
          attempt < MAX_CREATE_ATTEMPTS - 1
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new Error('Refresh session creation exhausted all retry attempts');
  }
}

/**
 * Maximum number of attempts used to replace an active same-device refresh
 * session when a concurrent write races with the current sign-in.
 */
const MAX_CREATE_ATTEMPTS = 2;
