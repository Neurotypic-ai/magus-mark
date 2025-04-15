import { describe, expect, it } from 'vitest';

import type { SubdomainTag } from './SubdomainTag';

describe('SubdomainTag', () => {
  it('accepts string values as subdomains', () => {
    // Type tests - will compile if typing is correct
    const tag1: SubdomainTag = 'frontend';
    const tag2: SubdomainTag = 'backend';
    const tag3: SubdomainTag = 'devops';

    expect(typeof tag1).toBe('string');
    expect(typeof tag2).toBe('string');
    expect(typeof tag3).toBe('string');
  });

  it('can be used in arrays of subdomain tags', () => {
    const tags: SubdomainTag[] = ['frontend', 'database', 'security'];

    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBe(3);
    expect(tags).toContain('frontend');
    expect(tags).toContain('security');
  });
});
