import type { PaginationParams } from './PaginatedResult';

/**
 * Sorting options
 */

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter options
 */

export interface FilterOptions<T> {
  field: keyof T;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'startsWith' | 'endsWith';
  value: unknown;
}

/**
 * Query options
 */

export interface QueryOptions<T> {
  pagination?: PaginationParams;
  sort?: SortOptions;
  filters?: FilterOptions<T>[];
}
