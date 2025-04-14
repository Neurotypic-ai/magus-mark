import { describe, expect, it } from 'vitest';

import type { PaginatedResult, PaginationParams } from './PaginatedResult';

describe('Pagination Types', () => {
  it('validates PaginationParams', () => {
    const params: PaginationParams = {
      page: 2,
      pageSize: 10,
    };

    expect(params.page).toBe(2);
    expect(params.pageSize).toBe(10);

    // Can add optional fields
    params.totalItems = 100;
    params.totalPages = 10;

    expect(params.totalItems).toBe(100);
    expect(params.totalPages).toBe(10);
  });

  it('validates PaginatedResult', () => {
    const result: PaginatedResult<string> = {
      items: ['item1', 'item2'],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 2,
        totalPages: 1,
      },
    };

    expect(result.items.length).toBe(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalItems).toBe(2);
  });
});
