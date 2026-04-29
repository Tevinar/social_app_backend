import { BadRequestException } from '@nestjs/common';

/**
 * Extracts the raw bearer token value from the Authorization header.
 *
 * @param authorization Authorization header submitted by the caller.
 * @returns Raw access token.
 * @throws {BadRequestException} Thrown when the header is missing or malformed.
 */
export function extractBearerToken(authorization: string | undefined): string {
  if (!authorization?.startsWith('Bearer ')) {
    throw new BadRequestException('Missing bearer token');
  }

  return authorization.slice('Bearer '.length);
}
