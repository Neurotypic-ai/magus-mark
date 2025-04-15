import { describe, expect, it } from 'vitest';

import type { LifeAreaTag } from './LifeAreaTag';

describe('LifeAreaTag', () => {
  it('validates LifeAreaTag type usage', () => {
    const validLifeAreas: LifeAreaTag[] = [
      'career',
      'relationships',
      'health',
      'learning',
      'projects',
      'personal-growth',
      'finance',
      'hobby',
    ];

    expect(validLifeAreas.length).toBeGreaterThan(0);
    validLifeAreas.forEach((area) => {
      expect(typeof area).toBe('string');
    });
  });
});
