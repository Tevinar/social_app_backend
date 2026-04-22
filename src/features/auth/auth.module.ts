import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { AUTH_REGISTRATION_WRITER } from './application/ports/auth-registration-writer';
import { AUTH_USER_READER } from './application/ports/auth-user-reader';
import { PASSWORD_HASHER } from './application/ports/password-hasher';
import { PASSWORD_VERIFIER } from './application/ports/password-verifier';
import { REFRESH_SESSION_WRITER } from './application/ports/refresh-session-writer';
import { TOKEN_CREATOR } from './application/ports/token-creator';
import { TOKEN_HASHER } from './application/ports/token-hasher';
import { SignInWithEmailPasswordUseCase } from './application/use-cases/sign-in-with-email-password';
import { SignUpWithEmailPasswordUseCase } from './application/use-cases/sign-up-with-email-password';
import { PostgresAuthRegistrationWriter } from './infrastructure/persistence/postgres-auth-registration-writer';
import { PostgresAuthUserReader } from './infrastructure/persistence/postgres-auth-user-reader';
import { PostgresRefreshSessionWriter } from './infrastructure/persistence/postgres-refresh-session-writer';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher';
import { Argon2PasswordVerifier } from './infrastructure/security/argon2-password-verifier';
import { HmacTokenHasher } from './infrastructure/security/hmac-token-hasher';
import { JwtTokenCreator } from './infrastructure/security/jwt-token-creator';
import { AuthController } from './presentation/auth.controller';

/**
 * Feature module that wires the authentication slice into Nest's DI graph.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    SignUpWithEmailPasswordUseCase,
    SignInWithEmailPasswordUseCase,

    {
      provide: AUTH_REGISTRATION_WRITER,
      useClass: PostgresAuthRegistrationWriter,
    },
    {
      provide: AUTH_USER_READER,
      useClass: PostgresAuthUserReader,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: Argon2PasswordHasher,
    },
    {
      provide: PASSWORD_VERIFIER,
      useClass: Argon2PasswordVerifier,
    },
    {
      provide: REFRESH_SESSION_WRITER,
      useClass: PostgresRefreshSessionWriter,
    },
    {
      provide: TOKEN_CREATOR,
      useClass: JwtTokenCreator,
    },
    {
      provide: TOKEN_HASHER,
      useClass: HmacTokenHasher,
    },
  ],
  exports: [],
})
export class AuthModule {}
