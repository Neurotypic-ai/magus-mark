import { describe, it, expect } from 'vitest';
import { 
  isObject, 
  deepMerge, 
  get,
  has 
} from './object';

describe('Object Utilities', () => {
  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject(Object.create(null))).toBe(true);
    });

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('should return false for primitive values', () => {
      expect(isObject(42)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject(undefined)).toBe(false);
    });

    it('should return false for functions', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      expect(isObject(() => {})).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      expect(isObject(function() {})).toBe(false);
    });
  });

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
          d: 3 
        } 
      };
      
      const source = { 
        b: { 
          d: 4, 
          e: 5 
        }, 
        f: 6 
      };
      
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ 
        a: 1, 
        b: { 
          c: 2, 
          d: 4, 
          e: 5 
        }, 
        f: 6 
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

  describe('get', () => {
    it('should get value from object by path', () => {
      const obj = { 
        a: { 
          b: { 
            c: 42 
          } 
        } 
      };
      
      expect(get(obj, 'a.b.c')).toBe(42);
    });

    it('should return undefined for non-existent paths', () => {
      const obj = { a: { b: 1 } };
      
      expect(get(obj, 'a.c')).toBeUndefined();
      expect(get(obj, 'x.y.z')).toBeUndefined();
    });

    it('should return default value when path does not exist', () => {
      const obj = { a: { b: 1 } };
      
      expect(get(obj, 'a.c', 'default')).toBe('default');
      expect(get(obj, 'x.y.z', 42)).toBe(42);
    });

    it('should handle undefined input gracefully', () => {
      expect(get(undefined, 'a.b')).toBeUndefined();
      expect(get(undefined, 'a.b', 'default')).toBe('default');
    });

    it('should handle non-object values in path gracefully', () => {
      const obj = { a: 1 };
      
      expect(get(obj, 'a.b')).toBeUndefined();
      expect(get(obj, 'a.b', 'default')).toBe('default');
    });
  });

  describe('has', () => {
    it('should return true for direct properties', () => {
      const obj = { a: 1, b: undefined };
      
      expect(has(obj, 'a')).toBe(true);
      expect(has(obj, 'b')).toBe(true); // Should work even for undefined values
    });

    it('should return false for non-existent properties', () => {
      const obj = { a: 1 };
      
      expect(has(obj, 'b')).toBe(false);
    });

    it('should return false for prototype properties', () => {
      const obj = Object.create({ a: 1 }) as Record<string, unknown>;
      obj['b'] = 2;
      
      expect(has(obj, 'a')).toBe(false); // Inherited from prototype
      expect(has(obj, 'b')).toBe(true);  // Direct property
      expect(has(obj, 'toString')).toBe(false); // From Object.prototype
    });

    it('should handle null and undefined gracefully', () => {
      expect(has(null, 'a')).toBe(false);
      expect(has(undefined, 'a')).toBe(false);
    });

    it('should work with numeric and symbol keys', () => {
      const sym = Symbol('test');
      const obj = { 
        [42]: 'number', 
        [sym]: 'symbol' 
      };
      
      expect(has(obj, '42')).toBe(true);
      expect(has(obj, sym.toString())).toBe(true);
    });
  });
}); 