import { InvalidPaginationError } from './invalid-pagination.error';
import { MAX_PAGE_SIZE } from './pagination.constants';

/**
 * Immutable pagination value object used across read-oriented use cases.
 */
export class Pagination {
  /**
   * Creates pagination from already-validated values.
   *
   * @param page One-based page number.
   * @param pageSize Number of items to return per page.
   */
  private constructor(
    readonly page: number,
    readonly pageSize: number,
  ) {}

  /**
   * Builds pagination from raw caller input.
   *
   * @param page Requested one-based page number.
   * @param pageSize Requested number of items per page.
   * @returns Validated pagination value object.
   * @throws {InvalidPaginationError} Thrown when pagination is invalid.
   */
  static from(page: number, pageSize: number): Pagination {
    if (!Number.isInteger(page) || page < 1) {
      throw new InvalidPaginationError(
        'Page must be an integer greater than or equal to 1',
      );
    }

    if (
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > MAX_PAGE_SIZE
    ) {
      throw new InvalidPaginationError(
        `Page size must be between 1 and ${MAX_PAGE_SIZE}`,
      );
    }

    return new Pagination(page, pageSize);
  }

  /**
   * Number of rows to skip before reading the current page.
   *
   * @returns Zero-based row offset for persistence queries.
   */
  get offset(): number {
    return (this.page - 1) * this.pageSize;
  }
}
