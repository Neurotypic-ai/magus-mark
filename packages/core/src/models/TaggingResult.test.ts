import { describe, expect, it } from 'vitest';

import type { TaggingResult } from './TaggingResult';

describe('TaggingResult', () => {
  it('validates successful tagging result', () => {
    const result: TaggingResult = {
      success: true,
      tags: {
        year: '2023',
        topical_tags: [
          {
            domain: 'technology',
            subdomain: 'ai',
          },
        ],
        conversation_type: 'deep-dive',
        confidence: {
          overall: 0.9,
          domain: 0.95,
        },
      },
    };

    expect(result.success).toBe(true);
    expect(result.tags).toBeDefined();
    if (result.success && result.tags) {
      const tags = result.tags;
      expect(tags.year).toBe('2023');
      expect(tags.topical_tags.length).toBeGreaterThan(0);
      expect(tags.confidence.overall).toBe(0.9);
    }
    expect(result.error).toBeUndefined();
  });

  it('validates failed tagging result', () => {
    const result: TaggingResult = {
      success: false,
      error: {
        message: 'Failed to process text',
        code: 'PROCESSING_ERROR',
        recoverable: true,
      },
    };

    expect(result.success).toBe(false);
    expect(result.tags).toBeUndefined();
    expect(result.error).toBeDefined();
    if (!result.success && result.error) {
      expect(result.error.message).toBe('Failed to process text');
      expect(result.error.code).toBe('PROCESSING_ERROR');
      expect(result.error.recoverable).toBe(true);
    }
  });
});
