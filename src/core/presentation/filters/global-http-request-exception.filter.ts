import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import * as Sentry from '@sentry/nestjs';
import { ErrorToExceptionMapper } from './error-to-exception.mapper';

/**
 * Global HTTP boundary that converts thrown errors into HTTP responses.
 */
@Catch()
export class GlobalHttpRequestExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpRequestExceptionFilter.name);

  /**
   * Receives the shared mapper used to classify thrown errors.
   *
   * @param errorToExceptionMapper Maps thrown errors to public error metadata.
   */
  constructor(
    private readonly errorToExceptionMapper: ErrorToExceptionMapper,
  ) {}

  /**
   * Receives all exceptions thrown during HTTP request handling.
   *
   * @param error Error thrown from the request pipeline.
   * @param host Nest execution context for the current request.
   */
  catch(error: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    if (error instanceof HttpException) {
      // The errors that are caught here:
      // - ValidationPipe exceptions for invalid request data
      // - Manually thrown HttpExceptions for expected error cases in controllers or guards
      const statusCode = error.getStatus();

      response.status(statusCode).json({
        statusCode,
        code: this.extractHttpExceptionCode(error),
        message: this.extractHttpExceptionMessage(error),
        path: request.url,
        timestamp: new Date().toISOString(),
      });

      return;
    }
    // The errors that are caught here:
    // - business errors
    // - unexpected errors
    const mapped = this.errorToExceptionMapper.mapError(error);

    if (!mapped.isExpected) {
      this.logger.error(
        `Unhandled request failure: ${request.method} ${request.url}`,
        error instanceof Error ? error.stack : 'No stack trace available',
      );

      this.sendUnexpectedRequestFailureToSentry(error, request);
    }

    response.status(mapped.httpStatus).json({
      statusCode: mapped.httpStatus,
      code: mapped.code,
      message: mapped.message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Sends unexpected request failures to Sentry with normalized HTTP context
   * and the authenticated user identifier when available.
   *
   * @param error Unexpected error thrown during request handling.
   * @param request Express request active when the failure happened.
   */
  private sendUnexpectedRequestFailureToSentry(
    error: unknown,
    request: Request,
  ): void {
    const currentUserId = this.extractUserIdFromRequest(request);
    const captureContext: Sentry.ExclusiveEventHintOrCaptureContext = {
      tags: {
        method: request.method,
        path: request.path,
      },
      contexts: {
        request: {
          method: request.method,
          path: request.path,
          query: request.query,
          url: request.originalUrl,
        },
      },
    };

    if (currentUserId) {
      captureContext.user = { id: currentUserId };
    }

    Sentry.captureException(error, captureContext);
  }

  /**
   * Extracts the authenticated user identifier from the current HTTP request
   *
   * @param request Express request from the current HTTP execution context.
   * @returns A user ID when an authenticated user is present.
   */
  private extractUserIdFromRequest(request: Request): string | undefined {
    // This global filter also handles public routes, so `request.auth` is only
    // present when a request already passed through the auth guard.
    const authenticatedRequest = request as Request & {
      auth?: { userId?: string };
    };

    const userId = authenticatedRequest.auth?.userId;

    if (typeof userId !== 'string') {
      return undefined;
    }

    return userId;
  }

  /**
   * Extracts one human-readable message from a Nest HTTP exception response.
   *
   * Nest HTTP exceptions may expose their response body as:
   * - a plain string
   * - an object with a string `message`
   * - an object with a `message` array produced by validation failures
   *
   * This helper normalizes those variants into one displayable message for the
   * public HTTP error payload.
   *
   * @param error HTTP exception whose message payload should be normalized.
   * @returns One public error message suitable for the JSON response body.
   */
  private extractHttpExceptionMessage(error: HttpException): string {
    const response = error.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      const message = (response as { message?: unknown }).message;

      if (typeof message === 'string') {
        return message;
      }

      if (Array.isArray(message)) {
        const joined = message
          .filter((value): value is string => typeof value === 'string')
          .join('; ');

        if (joined) {
          return joined;
        }
      }
    }

    return error.message || 'Unexpected error';
  }

  /**
   * Extracts one stable public code from a Nest HTTP exception response.
   *
   * Validation failures are normalized to `validation_error`. Other HTTP
   * exceptions are normalized by status code so all HTTP failures expose the
   * same response contract to clients.
   *
   * @param error HTTP exception whose public code should be normalized.
   * @returns One public code suitable for the JSON response body.
   */
  private extractHttpExceptionCode(error: HttpException): string {
    const response = error.getResponse();

    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      const message = (response as { message?: unknown }).message;

      if (Array.isArray(message)) {
        return 'validation_error';
      }
    }

    const status = error.getStatus();

    switch (status) {
      case 400:
        return 'bad_request';
      case 401:
        return 'unauthorized';
      case 403:
        return 'forbidden';
      case 404:
        return 'not_found';
      case 409:
        return 'conflict';
    }
    return 'http_exception';
  }
}
