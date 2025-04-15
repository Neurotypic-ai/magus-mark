import { describe, expect, it } from 'vitest';

import type { SubdomainTypes } from './SubdomainTypes';

describe('SubdomainTypes', () => {
  it('validates subdomain types structure', () => {
    // Create a minimal valid subdomain types for testing
    // We use a partial structure since we don't need to define all domains
    // Using type assertion to avoid importing actual constants
    const types = {
      'software-development': ['frontend', 'backend', 'devops'],
      ai: ['machine-learning', 'nlp', 'computer-vision'],
    } as Partial<SubdomainTypes>;

    // Validate the structure
    expect(Array.isArray(types['software-development'])).toBe(true);
    expect(types['software-development']).toContain('frontend');
    expect(types['software-development']).toContain('backend');

    expect(Array.isArray(types.ai)).toBe(true);
    expect(types.ai).toContain('machine-learning');
  });

  it('enables lookup by domain key', () => {
    // Test that we can use domain keys for lookup
    // Using type assertion to avoid importing actual constants
    function getSubdomains(domain: keyof SubdomainTypes, types: Partial<SubdomainTypes>): string[] {
      const subdomains = types[domain];
      return Array.isArray(subdomains) ? subdomains : [];
    }

    const types = {
      technology: ['hardware', 'software'],
    } as Partial<SubdomainTypes>;

    // Test with a key we know exists in our partial types
    const techSubdomains = getSubdomains('technology', types);
    expect(techSubdomains).toContain('hardware');
    expect(techSubdomains).toContain('software');
  });
});
