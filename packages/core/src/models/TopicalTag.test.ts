import { describe, expect, it } from 'vitest';

import type { TopicalTag } from './TopicalTag';

describe('TopicalTag', () => {
  it('validates TopicalTag interface structure', () => {
    const validTopicalTag: TopicalTag = {
      domain: 'technology',
      subdomain: 'ai',
      contextual: 'beginner',
    };

    const minimalTopicalTag: TopicalTag = {
      domain: 'technology',
    };

    expect(validTopicalTag.domain).toBe('technology');
    expect(validTopicalTag.subdomain).toBe('ai');
    expect(validTopicalTag.contextual).toBe('beginner');

    expect(minimalTopicalTag.domain).toBe('technology');
    expect(minimalTopicalTag.subdomain).toBeUndefined();
    expect(minimalTopicalTag.contextual).toBeUndefined();
  });
});
