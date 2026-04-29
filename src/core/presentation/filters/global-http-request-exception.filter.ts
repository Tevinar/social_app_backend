import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
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
      response.status(error.getStatus()).json({
        statusCode: error.getStatus(),
        message: error.getResponse(),
        path: request.url,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    const mapped = this.errorToExceptionMapper.mapError(error);

    if (!mapped.isExpected) {
      this.logger.error(
        `Unhandled request failure: ${request.method} ${request.url}`,
        error instanceof Error ? error.stack : 'No stack trace available',
      );
    }

    response.status(mapped.httpStatus).json({
      statusCode: mapped.httpStatus,
      code: mapped.code,
      message: mapped.message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
