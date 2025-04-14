import { describe, it, expect } from 'vitest';
import type { QueryOptions, FilterOptions, SortOptions } from './QueryOptions';

describe('Query Types', () => {
  it('validates SortOptions', () => {
    const ascSort: SortOptions = {
      field: 'name',
      direction: 'asc'
    };
    
    const descSort: SortOptions = {
      field: 'createdAt',
      direction: 'desc'
    };
    
    expect(ascSort.field).toBe('name');
    expect(ascSort.direction).toBe('asc');
    
    expect(descSort.field).toBe('createdAt');
    expect(descSort.direction).toBe('desc');
  });
  
  it('validates FilterOptions', () => {
    interface User {
      id: string;
      name: string;
      age: number;
    }
    
    const eqFilter: FilterOptions<User> = {
      field: 'name',
      operator: '=',
      value: 'John'
    };
    
    const gtFilter: FilterOptions<User> = {
      field: 'age',
      operator: '>',
      value: 18
    };
    
    const containsFilter: FilterOptions<User> = {
      field: 'name',
      operator: 'contains',
      value: 'oh'
    };
    
    expect(eqFilter.field).toBe('name');
    expect(eqFilter.operator).toBe('=');
    expect(eqFilter.value).toBe('John');
    
    expect(gtFilter.field).toBe('age');
    expect(gtFilter.operator).toBe('>');
    expect(gtFilter.value).toBe(18);
    
    expect(containsFilter.operator).toBe('contains');
  });
  
  it('validates QueryOptions', () => {
    interface Post {
      id: string;
      title: string;
      views: number;
    }
    
    const options: QueryOptions<Post> = {
      pagination: {
        page: 1,
        pageSize: 20
      },
      sort: {
        field: 'views',
        direction: 'desc'
      },
      filters: [
        {
          field: 'views',
          operator: '>',
          value: 100
        }
      ]
    };
    
    expect(options.pagination?.page).toBe(1);
    expect(options.sort?.field).toBe('views');
    if (options.filters?.[0]) {
      expect((options.filters[0]).field).toBe('views');
    }
  });
}); 