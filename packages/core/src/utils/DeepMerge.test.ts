import { describe, expect, it } from 'vitest';

import { deepMerge } from './DeepMerge';

describe('Object Utilities', () => {
  describe('deepMerge', () => {
    it('should merge shallow objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };

      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
      // Should not modify original objects
      expect(target).toEqual({ a: 1, b: 2 });
      expect(source).toEqual({ b: 3, c: 4 });
    });

    it('should deeply merge nested objects', () => {
      const target = {
        a: 1,
        b: {
          c: 2,
          d: 3,
        },
      };

      const source = {
        b: {
          d: 4,
          e: 5,
        },
        f: 6,
      };

      const result = deepMerge(target, source);

      expect(result).toEqual({
        a: 1,
        b: {
          c: 2,
          d: 4,
          e: 5,
        },
        f: 6,
      });
    });

    it('should handle non-object source values', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: 3 };

      const result = deepMerge(target, source);

      // Non-object source should override object target
      expect(result).toEqual({ a: 1, b: 3 });
    });

    it('should add new properties from source when not in target', () => {
      const target = { a: 1 };
      const source = { b: { c: 2 } };

      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: { c: 2 } });
    });

    it('should not merge arrays - should replace them', () => {
      const target = { a: [1, 2] };
      const source = { a: [3, 4] };

      const result = deepMerge(target, source);

      // Arrays should be replaced, not merged
      expect(result.a).toEqual([3, 4]);
    });
  });
});
