/**
 * Pagination parameters
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
  totalItems?: number;
  totalPages?: number;
}

/**
 * Pagination result
 */

export interface PaginatedResult<T> {
  items: T[];
  pagination: Required<PaginationParams>;
}
