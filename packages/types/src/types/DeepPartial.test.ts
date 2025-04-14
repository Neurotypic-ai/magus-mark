import { describe, expect, it } from 'vitest';

import type { DeepPartial } from './DeepPartial';

describe('DeepPartial', () => {
  it('works with simple objects', () => {
    interface TestType {
      a: string;
      b: number;
      c: boolean;
    }

    const partial: DeepPartial<TestType> = { a: 'test' };

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
        b: {},
      },
    };

    expect(partial.a?.b?.c).toBeUndefined();
    expect(partial.a?.d).toBeUndefined();
  });

  it('works with arrays', () => {
    interface WithArray {
      items: { id: string; value: number }[];
    }

    const partial: DeepPartial<WithArray> = {
      items: [{ id: 'test' }],
    };

    expect(partial.items?.[0]?.id).toBe('test');
    expect(partial.items?.[0]?.value).toBeUndefined();
  });
});
