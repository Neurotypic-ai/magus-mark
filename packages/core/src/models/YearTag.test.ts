import { describe, expect, it } from 'vitest';

import type { YearTag } from './YearTag';

describe('YearTag', () => {
  it('validates YearTag type constraints', () => {
    const validYear: YearTag = '2023';
    expect(typeof validYear).toBe('string');
    expect(validYear.length).toBe(4);
  });
});
