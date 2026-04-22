import { type CreateRefreshSessionParams } from './refresh-session-writer';

export const AUTH_REGISTRATION_WRITER = Symbol('AUTH_REGISTRATION_WRITER');

/**
 * Application port used to persist a newly registered user and the initial
 * refresh session in one atomic operation.
 */
export interface AuthRegistrationWriter {
  /**
   * Persists the sign-up write set transactionally.
   *
   * Implementations are expected to create the user/profile records and the
   * initial refresh session inside the same database transaction.
   *
   * @param params Registration data to persist atomically.
   * @returns The outcome of the atomic registration write.
   */
  create(
    params: CreateAuthRegistrationParams,
  ): Promise<CreateAuthRegistrationResult>;
}

/**
 * Data required to persist a full registration transaction.
 */
export type CreateAuthRegistrationParams = {
  user: CreateAuthUserParams;
  refreshSession: CreateRefreshSessionParams;
};

/**
 * Data required to create a new authentication user record.
 */
export type CreateAuthUserParams = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
};

/**
 * Outcome of the atomic registration write.
 */
export enum CreateAuthRegistrationResult {
  CREATED = 'created',
  EMAIL_CONFLICT = 'email_conflict',
}
