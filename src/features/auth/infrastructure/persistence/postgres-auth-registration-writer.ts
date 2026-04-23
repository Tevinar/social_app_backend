import { Injectable } from '@nestjs/common';
import postgres from 'postgres';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  CreateAuthRegistrationResult,
  type AuthRegistrationWriter,
  type CreateAuthRegistrationParams,
} from '../../application/ports/identity/auth-registration-writer';

/**
 * Name of the unique constraint that protects `users.email`.
 *
 * Postgres assigns this default name for a unique column constraint unless it
 * is explicitly overridden in the migration.
 */
const USERS_EMAIL_UNIQUE_CONSTRAINT_NAME = 'users_email_key';

/**
 * PostgreSQL SQLSTATE code for a unique-constraint violation.
 */
const POSTGRES_UNIQUE_VIOLATION_ERROR_CODE = '23505';

/**
 * Detects whether a database error corresponds to the unique email constraint.
 *
 * @param error Error thrown by the Postgres client.
 * @returns `true` when the error represents an email uniqueness conflict.
 */
function isUsersEmailConflict(error: unknown): boolean {
  return (
    error instanceof postgres.PostgresError &&
    error.code === POSTGRES_UNIQUE_VIOLATION_ERROR_CODE &&
    error.constraint_name === USERS_EMAIL_UNIQUE_CONSTRAINT_NAME
  );
}

/**
 * Postgres-backed implementation of the atomic auth-registration port.
 *
 * This adapter persists the new user, profile, and initial refresh session in
 * one transaction so sign-up does not leave behind partial state when one write
 * fails.
 */
@Injectable()
export class PostgresAuthRegistrationWriter implements AuthRegistrationWriter {
  /**
   * Receives the shared database service used to execute registration writes.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Persists the sign-up write set in one database transaction.
   *
   * The transaction creates the `users` row first, then the associated
   * `profiles` row, and finally the `refresh_sessions` row bound to the same
   * user identifier. A unique-email violation is converted into a stable
   * application-level outcome so the use case can raise `EmailAlreadyInUseError`.
   *
   * @param params Registration data to persist atomically.
   * @returns The outcome of the atomic registration write.
   */
  async create(
    params: CreateAuthRegistrationParams,
  ): Promise<CreateAuthRegistrationResult> {
    const { user, refreshSession } = params;

    try {
      await this.database.sql.begin(async (sql) => {
        await sql`
          insert into users (
            id,
            email,
            password_hash
          )
          values (
            ${user.id},
            ${user.email},
            ${user.passwordHash}
          )
        `;

        await sql`
          insert into profiles (
            user_id,
            name
          )
          values (
            ${user.id},
            ${user.name}
          )
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
            ${refreshSession.id},
            ${refreshSession.userId},
            ${refreshSession.deviceId},
            ${refreshSession.tokenHash},
            ${refreshSession.expiresAt}
          )
        `;
      });

      return CreateAuthRegistrationResult.CREATED;
    } catch (error: unknown) {
      if (isUsersEmailConflict(error)) {
        return CreateAuthRegistrationResult.EMAIL_CONFLICT;
      }

      throw error;
    }
  }
}
