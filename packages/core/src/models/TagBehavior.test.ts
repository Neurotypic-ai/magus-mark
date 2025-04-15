import { describe, expect, it } from 'vitest';

import type { TagBehavior } from './TagBehavior';

describe('TagBehavior', () => {
  it('validates TagBehavior type constraints', () => {
    const validBehaviors: TagBehavior[] = ['append', 'replace', 'merge', 'suggest'];

    expect(validBehaviors.length).toBe(4);
    validBehaviors.forEach((behavior) => {
      expect(typeof behavior).toBe('string');
    });
  });
});
