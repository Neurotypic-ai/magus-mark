import { describe, it, expect } from 'vitest';
import type { StringRecord } from './StringRecord';

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