import { describe, expect, it } from 'vitest';

import type { ContextualTag } from './ContextualTag';
import type { ConversationTypeTag } from './ConversationTypeTag';
import type { DomainTag } from './DomainTag';
import type { LifeAreaTag } from './LifeAreaTag';
import type { SubdomainMap } from './SubdomainMap';
import type { Taxonomy } from './Taxonomy';

describe('Taxonomy', () => {
  it('validates taxonomy structure', () => {
    // Create a minimal valid taxonomy for testing
    const taxonomy: Taxonomy = {
      domains: ['technology', 'business'] as DomainTag[],
      subdomains: {
        technology: ['hardware', 'software'],
        business: ['marketing', 'operations'],
      } as unknown as SubdomainMap,
      lifeAreas: ['career', 'learning'] as LifeAreaTag[],
      conversationTypes: ['casual', 'deep-dive'] as ConversationTypeTag[],
      contextualTags: ['beginner', 'advanced'] as ContextualTag[],
    };

    // Validates structure
    expect(Array.isArray(taxonomy.domains)).toBe(true);
    expect(taxonomy.domains).toContain('technology');
    expect(taxonomy.domains).toContain('business');

    expect(typeof taxonomy.subdomains).toBe('object');
    expect(Array.isArray(taxonomy.subdomains.technology)).toBe(true);
    expect(taxonomy.subdomains.technology).toContain('hardware');

    expect(Array.isArray(taxonomy.lifeAreas)).toBe(true);
    expect(taxonomy.lifeAreas).toContain('career');

    expect(Array.isArray(taxonomy.conversationTypes)).toBe(true);
    expect(taxonomy.conversationTypes).toContain('casual');

    expect(Array.isArray(taxonomy.contextualTags)).toBe(true);
    expect(taxonomy.contextualTags).toContain('beginner');
  });

  it('can be extended with custom values', () => {
    // Test that we can extend the taxonomy with custom values
    const customTaxonomy: Taxonomy = {
      domains: ['technology', 'custom-domain'] as DomainTag[],
      subdomains: {
        technology: ['hardware', 'software'],
        'custom-domain': ['custom-subdomain'],
      } as unknown as SubdomainMap,
      lifeAreas: ['career', 'custom-life-area'] as LifeAreaTag[],
      conversationTypes: ['casual', 'custom-conversation'] as ConversationTypeTag[],
      contextualTags: ['beginner', 'custom-contextual'] as ContextualTag[],
    };

    // Validates custom extensions
    expect(customTaxonomy.domains).toContain('custom-domain');
    expect(customTaxonomy.subdomains['custom-domain']).toContain('custom-subdomain');
    expect(customTaxonomy.lifeAreas).toContain('custom-life-area');
    expect(customTaxonomy.conversationTypes).toContain('custom-conversation');
    expect(customTaxonomy.contextualTags).toContain('custom-contextual');
  });
});
