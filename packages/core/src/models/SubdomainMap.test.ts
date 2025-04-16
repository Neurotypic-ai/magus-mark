import { describe, expect, it } from 'vitest';

import type { SubdomainMap } from './SubdomainMap';

describe('SubdomainMap', () => {
  it('allows accessing subdomains by domain key', () => {
    // We're testing the type structure, not actual values
    // Using type assertion to avoid having to define all domains
    const partialMap = {
      'software-development': ['frontend', 'backend', 'devops', 'mobile'],
      ai: ['machine-learning', 'nlp', 'computer-vision'],
    };

    // Test that we can access properties as expected
    type PartialSubdomainMap = Pick<SubdomainMap, 'software-development' | 'ai'>;
    const testMap = partialMap as PartialSubdomainMap;

    expect(Array.isArray(testMap['software-development'])).toBe(true);
    expect(testMap.ai).toContain('machine-learning');
  });

  it('allows storing domain-specific subdomain values', () => {
    // Create a mock function that takes a SubdomainMap
    const processMap = (map: Partial<SubdomainMap>): string[] => {
      const subdomains = map['software-development'];
      return Array.isArray(subdomains) ? subdomains : [];
    };

    const result = processMap({
      'software-development': ['frontend', 'backend'],
    });

    expect(result).toEqual(['frontend', 'backend']);
  });

  it('extends Record<string, string[]>', () => {
    // This should compile if SubdomainMap extends Record correctly
    const partial: Partial<SubdomainMap> = {
      'custom-domain': ['test1', 'test2'],
    };

    // Type check only - no runtime assertion needed
    expect(partial['custom-domain']).toBeDefined();
  });
});
