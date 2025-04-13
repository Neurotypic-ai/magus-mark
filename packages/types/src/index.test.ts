import { describe, it, expect, vi } from 'vitest';
import type {
  DeepPartial,
  StringRecord,
  Result,
  AsyncStatus,
  AsyncState,
  PaginationParams,
  PaginatedResult,
  SortOptions,
  FilterOptions,
  QueryOptions,
  TypedEventEmitter
} from '.';

describe('Utility Types', () => {
  describe('DeepPartial', () => {
    it('works with simple objects', () => {
      interface TestType { 
        a: string; 
        b: number; 
        c: boolean;
      }
      
      const partial: DeepPartial<TestType> = { a: 'test' };
      
      // Type assertion - this compiles, which is what we're testing
      expect(partial.a).toBe('test');
      expect(partial.b).toBeUndefined();
    });
    
    it('works with nested objects', () => {
      interface NestedType {
        a: {
          b: {
            c: string;
          };
          d: number;
        };
      }
      
      const partial: DeepPartial<NestedType> = { 
        a: { 
          b: {} 
        } 
      };
      
      // Type assertion - this compiles, which is what we're testing
      expect(partial.a?.b?.c).toBeUndefined();
      expect(partial.a?.d).toBeUndefined();
    });
    
    it('works with arrays', () => {
      interface WithArray {
        items: { id: string; value: number }[];
      }
      
      const partial: DeepPartial<WithArray> = {
        items: [{ id: 'test' }]
      };
      
      // Type assertion - this compiles, which is what we're testing
      expect(partial.items?.[0]?.id).toBe('test');
      expect(partial.items?.[0]?.value).toBeUndefined();
    });
  });

  describe('StringRecord', () => {
    it('creates a string keyed record', () => {
      const record: StringRecord<number> = {
        'one': 1,
        'two': 2
      };
      
      expect(record['one']).toBe(1);
      expect(record['two']).toBe(2);
      
      // Should compile since any string key is valid
      record['three'] = 3;
      expect(record['three']).toBe(3);
    });
  });

  describe('Result', () => {
    it('handles success case', () => {
      const successResult: Result<string> = {
        success: true,
        value: 'success'
      };
      
      expect(successResult.success).toBe(true);
      expect(successResult.value).toBe('success');
    });
    
    it('handles error case', () => {
      const errorResult: Result<string> = {
        success: false,
        error: new Error('Something went wrong')
      };
      
      expect(errorResult.success).toBe(false);
      expect(errorResult.error.message).toBe('Something went wrong');
    });
    
    it('handles custom error types', () => {
      class CustomError extends Error {
        code: string;
        constructor(message: string, code: string) {
          super(message);
          this.code = code;
        }
      }
      
      const errorResult: Result<string, CustomError> = {
        success: false,
        error: new CustomError('Custom error', 'E123')
      };
      
      expect(errorResult.success).toBe(false);
      expect(errorResult.error.code).toBe('E123');
    });
  });

  describe('AsyncStatus and AsyncState', () => {
    it('validates async status values', () => {
      const idle: AsyncStatus = 'idle';
      const loading: AsyncStatus = 'loading';
      const success: AsyncStatus = 'success';
      const error: AsyncStatus = 'error';
      
      expect(idle).toBe('idle');
      expect(loading).toBe('loading');
      expect(success).toBe('success');
      expect(error).toBe('error');
    });
    
    it('handles idle state', () => {
      const state: AsyncState<string> = {
        status: 'idle'
      };
      
      expect(state.status).toBe('idle');
      expect(state.data).toBeUndefined();
      expect(state.error).toBeUndefined();
    });
    
    it('handles loading state', () => {
      const state: AsyncState<string> = {
        status: 'loading'
      };
      
      expect(state.status).toBe('loading');
    });
    
    it('handles success state', () => {
      const state: AsyncState<string> = {
        status: 'success',
        data: 'test data'
      };
      
      expect(state.status).toBe('success');
      expect(state.data).toBe('test data');
    });
    
    it('handles error state', () => {
      const state: AsyncState<string> = {
        status: 'error',
        error: new Error('Failed to fetch data')
      };
      
      expect(state.status).toBe('error');
      expect(state.error?.message).toBe('Failed to fetch data');
    });
    
    it('handles custom error types', () => {
      interface APIError {
        statusCode: number;
        message: string;
      }
      
      const state: AsyncState<string, APIError> = {
        status: 'error',
        error: {
          statusCode: 404,
          message: 'Resource not found'
        }
      };
      
      expect(state.status).toBe('error');
      if (state.error) {
        expect(state.error.statusCode).toBe(404);
      }
    });
  });

  describe('Pagination Types', () => {
    it('validates PaginationParams', () => {
      const params: PaginationParams = {
        page: 2,
        pageSize: 10
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
          totalPages: 1
        }
      };
      
      expect(result.items.length).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalItems).toBe(2);
    });
  });

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
        expect(options.filters[0].field).toBe('views');
      }
    });
  });

  describe('TypedEventEmitter', () => {
    it('demonstrates type-safe events', () => {
      // Define event types
      type Events = Record<string, unknown[]> & {
        'user:created': [userId: string, name: string];
        'post:updated': [postId: string, title: string, content: string];
        'error': [error: Error];
      };
      
      // Create mock event emitter
      const mockEmit = vi.fn();
      const mockOn = vi.fn();
      const mockOff = vi.fn();
      const mockOnce = vi.fn();
      
      const emitter: TypedEventEmitter<Events> = {
        emit: mockEmit,
        on: mockOn,
        off: mockOff,
        once: mockOnce
      };
      
      // Type safety tests
      const userListener = (userId: string, name: string) => {
        expect(typeof userId).toBe('string');
        expect(typeof name).toBe('string');
      };
      
      emitter.on('user:created', userListener);
      expect(mockOn).toHaveBeenCalledWith('user:created', userListener);
      
      emitter.emit('user:created', 'user-123', 'John Doe');
      expect(mockEmit).toHaveBeenCalledWith('user:created', 'user-123', 'John Doe');
      
      const errorListener = (error: Error) => {
        expect(error instanceof Error).toBe(true);
      };
      
      emitter.on('error', errorListener);
      emitter.emit('error', new Error('Something went wrong'));
    });
  });
}); 