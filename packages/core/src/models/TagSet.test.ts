import { describe, expect, it } from 'vitest';

import type { TagSet } from './TagSet';

describe('TagSet', () => {
  it('validates TagSet interface structure', () => {
    const validTagSet: TagSet = {
      year: '2023',
      life_area: 'learning',
      topical_tags: [
        {
          domain: 'technology',
          subdomain: 'ai',
          contextual: 'beginner',
        },
      ],
      conversation_type: 'deep-dive',
      confidence: {
        overall: 0.92,
      },
    };

    expect(validTagSet.year).toBe('2023');
    expect(validTagSet.life_area).toBe('learning');
    expect(validTagSet.topical_tags.length).toBe(1);
    expect(validTagSet.conversation_type).toBe('deep-dive');
    expect(validTagSet.confidence?.overall).toBe(0.92);
  });
});
