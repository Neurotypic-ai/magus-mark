import { describe, expect, it } from 'vitest';

import type { TagConfidence } from './TagConfidence';

describe('TagConfidence', () => {
  it('validates TagConfidence interface structure', () => {
    const validTagConfidence: TagConfidence = {
      overall: 0.92,
      domain: 0.95,
      subdomain: 0.85,
      conversation_type: 0.9,
    };

    const minimalTagConfidence: TagConfidence = {
      overall: 0.75,
    };

    expect(validTagConfidence.overall).toBe(0.92);
    expect(typeof validTagConfidence.domain).toBe('number');

    expect(minimalTagConfidence.overall).toBe(0.75);
    expect(minimalTagConfidence.domain).toBeUndefined();
  });
});
