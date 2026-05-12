import { HttpStatus, applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponse } from './error-response.swagger';

type SupportedErrorStatus =
  | HttpStatus.BAD_REQUEST
  | HttpStatus.UNAUTHORIZED
  | HttpStatus.FORBIDDEN
  | HttpStatus.NOT_FOUND
  | HttpStatus.CONFLICT
  | HttpStatus.INTERNAL_SERVER_ERROR;

const SUPPORTED_ERROR_STATUS_ORDER: readonly SupportedErrorStatus[] = [
  HttpStatus.BAD_REQUEST,
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
  HttpStatus.NOT_FOUND,
  HttpStatus.CONFLICT,
  HttpStatus.INTERNAL_SERVER_ERROR,
];

/**
 * Documents one or more standardized HTTP error responses for an endpoint.
 *
 * The selected statuses all share the same public error schema because the
 * global HTTP exception filter normalizes them into one contract. An internal
 * server error response is always documented because any endpoint can still
 * fail unexpectedly at runtime.
 *
 * @param statuses Expected non-success HTTP statuses for the endpoint.
 * @returns Combined Swagger decorators documenting the selected statuses.
 */
export function ApiStandardErrorResponses(
  ...statuses: SupportedErrorStatus[]
): MethodDecorator & ClassDecorator {
  const requestedStatuses = new Set<SupportedErrorStatus>([
    ...statuses,
    HttpStatus.INTERNAL_SERVER_ERROR,
  ]);

  // Keep documented responses in a canonical order regardless of the order
  // passed by each endpoint so Swagger output stays consistent across routes.
  const decorators = SUPPORTED_ERROR_STATUS_ORDER.filter((status) =>
    requestedStatuses.has(status),
  ).map(_buildErrorResponseDecorator);

  return applyDecorators(...decorators);
}

/**
 * Builds one Swagger response decorator for a supported standardized status.
 *
 * @param status HTTP status to document.
 * @returns Swagger decorator documenting [ErrorResponse] for that status.
 */
function _buildErrorResponseDecorator(
  status: SupportedErrorStatus,
): MethodDecorator & ClassDecorator {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ApiBadRequestResponse({
        type: ErrorResponse,
        description: 'The request payload or parameters are invalid.',
      });

    case HttpStatus.UNAUTHORIZED:
      return ApiUnauthorizedResponse({
        type: ErrorResponse,
        description:
          'Authentication is required or the submitted token is invalid.',
      });

    case HttpStatus.FORBIDDEN:
      return ApiForbiddenResponse({
        type: ErrorResponse,
        description:
          'The authenticated caller does not have permission to perform this action.',
      });

    case HttpStatus.NOT_FOUND:
      return ApiNotFoundResponse({
        type: ErrorResponse,
        description: 'The requested resource was not found.',
      });

    case HttpStatus.CONFLICT:
      return ApiConflictResponse({
        type: ErrorResponse,
        description: 'The request conflicts with existing data or state.',
      });

    case HttpStatus.INTERNAL_SERVER_ERROR:
      return ApiInternalServerErrorResponse({
        type: ErrorResponse,
        description: 'An unexpected server error occurred.',
      });
  }
}
