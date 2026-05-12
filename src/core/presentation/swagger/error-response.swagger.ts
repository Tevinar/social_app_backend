import { ApiProperty } from '@nestjs/swagger';

/**
 * Shared OpenAPI schema for the normalized public HTTP error contract.
 *
 * This schema mirrors the JSON payload emitted by the global HTTP exception
 * filter for both expected business errors and unexpected request failures.
 */
export class ErrorResponse {
  /**
   * HTTP status code returned by the backend.
   */
  @ApiProperty({
    example: 400,
    description: 'HTTP status code returned by the backend.',
  })
  statusCode!: number;

  /**
   * Stable error code intended for client-side branching.
   */
  @ApiProperty({
    example: 'validation_error',
    description: 'Stable client-consumable error code.',
  })
  code!: string;

  /**
   * Human-readable error message.
   */
  @ApiProperty({
    example: 'Missing bearer token',
    description: 'Human-readable error message.',
  })
  message!: string;

  /**
   * Request path that produced the error.
   */
  @ApiProperty({
    example: '/auth/sign-in',
    description: 'Request path that produced the error.',
  })
  path!: string;

  /**
   * Timestamp when the error payload was created.
   */
  @ApiProperty({
    example: '2026-05-12T10:00:00.000Z',
    description: 'ISO-8601 timestamp when the error response was generated.',
    format: 'date-time',
  })
  timestamp!: string;
}
