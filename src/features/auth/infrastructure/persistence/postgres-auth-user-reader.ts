import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import {
  type AuthUser,
  type AuthUserReader,
} from '../../application/ports/auth-user-reader';

/**
 * Row shape returned by the auth-user lookup query after SQL column aliases are
 * applied.
 */
type AuthUserRow = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  emailVerifiedAt: Date | null;
};

/**
 * Postgres-backed implementation of the auth user reader port.
 *
 * This adapter loads the auth-specific user projection required by the sign-in
 * flow, including the profile name stored in the separate `profiles` table.
 */
@Injectable()
export class PostgresAuthUserReader implements AuthUserReader {
  /**
   * Receives the shared database service used to query auth user data.
   *
   * @param database Nest-injected Postgres access wrapper.
   */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Finds the auth user record associated with the provided normalized email.
   *
   * The query joins `users` and `profiles` so the returned data matches the
   * application port contract, which expects both credential fields and the
   * public profile name.
   *
   * @param email Normalized email address to look up.
   * @returns The matching auth user projection, or `null` when no user exists.
   */
  async findByEmail(email: string): Promise<AuthUser | null> {
    const rows = await this.database.sql<AuthUserRow[]>`
      select
        users.id,
        users.email,
        users.password_hash as "passwordHash",
        profiles.name,
        users.email_verified_at as "emailVerifiedAt"
      from users
      inner join profiles
        on profiles.user_id = users.id
      where users.email = ${email}
      limit 1
    `;

    return rows[0] ?? null;
  }
}
