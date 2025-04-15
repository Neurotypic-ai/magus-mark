import { describe, expect, it } from 'vitest';

import type { TaggingOptions } from './TaggingOptions';

describe('TaggingOptions', () => {
  it('validates tagging options', () => {
    const options: TaggingOptions = {
      model: 'gpt-4o',
      behavior: 'append',
      minConfidence: 0.6,
      reviewThreshold: 0.8,
      generateExplanations: true,
    };

    expect(options.model).toBe('gpt-4o');
    expect(options.behavior).toBe('append');
    expect(options.minConfidence).toBe(0.6);
    expect(options.reviewThreshold).toBe(0.8);
    expect(options.generateExplanations).toBe(true);

    // Behavior should only allow certain values
    const validBehaviors: TaggingOptions['behavior'][] = ['append', 'replace', 'merge'];
    expect(validBehaviors).toContain(options.behavior);
  });
});
