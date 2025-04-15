import { describe, expect, it } from 'vitest';

import type { ConfidenceScore } from './ConfidenceScore';

describe('ConfidenceScore', () => {
  it('validates ConfidenceScore type constraints', () => {
    const validScores: ConfidenceScore[] = [0, 0.5, 1];
    validScores.forEach((score) => {
      expect(typeof score).toBe('number');
      expect(score >= 0 && score <= 1).toBe(true);
    });
  });
});
