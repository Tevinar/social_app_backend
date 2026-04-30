import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { type Request } from 'express';
import { ValidateAccessTokenUseCase } from '../../application/use-cases/validate-access-token';

/**
 * HTTP auth guard that validates bearer access tokens and enriches the request
 * with the authenticated user identity.
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  /**
   * Receives the application service used to validate submitted access tokens.
   *
   * @param validateAccessToken Validates bearer access tokens and returns claims.
   */
  constructor(
    private readonly validateAccessToken: ValidateAccessTokenUseCase,
  ) {}

  /**
   * Validates the current request's bearer token before allowing the route
   * handler to execute.
   *
   * @param context Nest execution context for the current HTTP request.
   * @returns `true` when the request is authenticated successfully.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // This generic is only a TypeScript hint. The client does not send an
    // `auth` object; the guard adds it later in this request pipeline.
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Read the raw Authorization header from the underlying Express request.
    const authorization = request.headers.authorization;
    // Extract the bearer token value from `Authorization: Bearer <token>`.
    const accessToken = extractBearerToken(authorization);
    // Validate the token and resolve the authenticated identity claims.
    const claims = await this.validateAccessToken.execute(accessToken);

    // Enrich the server-side request object so downstream decorators and
    // handlers can read the authenticated user without reparsing the header.
    request.auth = {
      userId: claims.userId,
    };

    return true;
  }
}

/**
 * Extracts the raw bearer token value from the Authorization header.
 *
 * @param authorization Authorization header submitted by the caller.
 * @returns Raw access token.
 * @throws {BadRequestException} Thrown when the header is missing or malformed.
 */
function extractBearerToken(authorization: string | undefined): string {
  if (!authorization?.startsWith('Bearer ')) {
    throw new BadRequestException('Missing bearer token');
  }

  return authorization.slice('Bearer '.length);
}

export type AuthenticatedRequest = Request & {
  auth: {
    userId: string;
  };
};
