import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../guards/access-tokens';

export const AuthenticatedUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    // `AuthenticatedRequest` is only a compile-time type: get the current
    // request object, assume it has the extra `auth` field, and rely on the
    // auth guard having already attached that field earlier in the pipeline.
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.auth;
  },
);
