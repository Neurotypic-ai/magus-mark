import { describe, it, expect } from 'vitest';
import {
  // Taxonomy constants
  DOMAINS,
  LIFE_AREAS,
  CONVERSATION_TYPES,
  CONTEXTUAL_TAGS_LIST,
  SUBDOMAINS_MAP,
  DEFAULT_TAXONOMY,
  
  // Types (for TypeScript validation)
  type Taxonomy,
  type DomainTag,
  type LifeAreaTag,
  type ConversationTypeTag,
  type ContextualTag,
  type SubdomainMap
} from '..';

describe('Taxonomy Constants', () => {
  describe('Domain Tags', () => {
    it('contains expected domain values', () => {
      expect(DOMAINS).toContain('software-development');
      expect(DOMAINS).toContain('ai');
      expect(DOMAINS).toContain('business');
      expect(DOMAINS).toContain('technology');
      
      // Check that the array is non-empty and has the expected structure
      expect(DOMAINS.length).toBeGreaterThan(0);
      expect(Array.isArray(DOMAINS)).toBe(true);
    });
    
    it('allows using values as DomainTag type', () => {
      // Type validation - these should compile
      const domain1: DomainTag = 'software-development';
      const domain2: DomainTag = 'ai';
      
      expect(domain1).toBe('software-development');
      expect(domain2).toBe('ai');
      
      // Type extension test - allows custom string values
      const customDomain: DomainTag = 'custom-domain';
      expect(typeof customDomain).toBe('string');
    });
  });
  
  describe('Life Area Tags', () => {
    it('contains expected life area values', () => {
      expect(LIFE_AREAS).toContain('career');
      expect(LIFE_AREAS).toContain('learning');
      expect(LIFE_AREAS).toContain('health');
      expect(LIFE_AREAS).toContain('projects');
      
      expect(LIFE_AREAS.length).toBeGreaterThan(0);
      expect(Array.isArray(LIFE_AREAS)).toBe(true);
    });
    
    it('allows using values as LifeAreaTag type', () => {
      // Type validation - these should compile
      const lifeArea1: LifeAreaTag = 'career';
      const lifeArea2: LifeAreaTag = 'personal-growth';
      
      expect(lifeArea1).toBe('career');
      expect(lifeArea2).toBe('personal-growth');
    });
  });
  
  describe('Conversation Type Tags', () => {
    it('contains expected conversation type values', () => {
      expect(CONVERSATION_TYPES).toContain('deep-dive');
      expect(CONVERSATION_TYPES).toContain('reflection');
      expect(CONVERSATION_TYPES).toContain('question');
      expect(CONVERSATION_TYPES).toContain('analysis');
      
      expect(CONVERSATION_TYPES.length).toBeGreaterThan(0);
      expect(Array.isArray(CONVERSATION_TYPES)).toBe(true);
    });
    
    it('allows using values as ConversationTypeTag type', () => {
      // Type validation - these should compile
      const convType1: ConversationTypeTag = 'deep-dive';
      const convType2: ConversationTypeTag = 'theory';
      
      expect(convType1).toBe('deep-dive');
      expect(convType2).toBe('theory');
    });
  });
  
  describe('Contextual Tags', () => {
    it('contains expected contextual tag values', () => {
      expect(CONTEXTUAL_TAGS_LIST).toContain('beginner');
      expect(CONTEXTUAL_TAGS_LIST).toContain('advanced');
      expect(CONTEXTUAL_TAGS_LIST).toContain('tutorial');
      expect(CONTEXTUAL_TAGS_LIST).toContain('case-study');
      
      expect(CONTEXTUAL_TAGS_LIST.length).toBeGreaterThan(0);
      expect(Array.isArray(CONTEXTUAL_TAGS_LIST)).toBe(true);
    });
    
    it('allows using values as ContextualTag type', () => {
      // Type validation - these should compile
      const contextual1: ContextualTag = 'beginner';
      const contextual2: ContextualTag = 'advanced';
      
      expect(contextual1).toBe('beginner');
      expect(contextual2).toBe('advanced');
      
      // Type extension test - allows custom string values
      const customContextual: ContextualTag = 'custom-context';
      expect(typeof customContextual).toBe('string');
    });
  });
  
  describe('Subdomains Map', () => {
    it('contains expected subdomain relationships', () => {
      // Check that the subdomain map has entries for major domains
      expect(SUBDOMAINS_MAP).toHaveProperty('software-development');
      expect(SUBDOMAINS_MAP).toHaveProperty('ai');
      expect(SUBDOMAINS_MAP).toHaveProperty('design');
      
      // Check specific subdomain values
      expect(SUBDOMAINS_MAP['software-development']).toContain('frontend');
      expect(SUBDOMAINS_MAP['software-development']).toContain('backend');
      
      expect(SUBDOMAINS_MAP.ai).toContain('machine-learning');
      expect(SUBDOMAINS_MAP.ai).toContain('deep-learning');
      
      expect(SUBDOMAINS_MAP.design).toContain('ux');
      expect(SUBDOMAINS_MAP.design).toContain('ui');
    });
    
    it('allows accessing subdomains for each domain', () => {
      // Type validation - this should compile
      const frontendSubdomain = SUBDOMAINS_MAP['software-development'][0];
      const aiSubdomain = SUBDOMAINS_MAP.ai[0];
      
      expect(typeof frontendSubdomain).toBe('string');
      expect(typeof aiSubdomain).toBe('string');
    });
  });
  
  describe('Default Taxonomy', () => {
    it('contains all required taxonomy components', () => {
      expect(DEFAULT_TAXONOMY).toHaveProperty('domains');
      expect(DEFAULT_TAXONOMY).toHaveProperty('subdomains');
      expect(DEFAULT_TAXONOMY).toHaveProperty('lifeAreas');
      expect(DEFAULT_TAXONOMY).toHaveProperty('conversationTypes');
      expect(DEFAULT_TAXONOMY).toHaveProperty('contextualTags');
      
      // Check that the properties have the right structure
      expect(Array.isArray(DEFAULT_TAXONOMY.domains)).toBe(true);
      expect(Array.isArray(DEFAULT_TAXONOMY.lifeAreas)).toBe(true);
      expect(Array.isArray(DEFAULT_TAXONOMY.conversationTypes)).toBe(true);
      expect(Array.isArray(DEFAULT_TAXONOMY.contextualTags)).toBe(true);
      expect(typeof DEFAULT_TAXONOMY.subdomains).toBe('object');
    });
    
    it('validates as a Taxonomy type', () => {
      // Type validation - this should compile
      const taxonomy: Taxonomy = DEFAULT_TAXONOMY;
      
      expect(taxonomy).toEqual(DEFAULT_TAXONOMY);
      
      // Test that we can create a custom taxonomy
      const customTaxonomy: Taxonomy = {
        domains: [...DEFAULT_TAXONOMY.domains, 'custom-domain'],
        subdomains: {
          ...DEFAULT_TAXONOMY.subdomains,
          'custom-domain': ['sub1', 'sub2']
        },
        lifeAreas: DEFAULT_TAXONOMY.lifeAreas,
        conversationTypes: DEFAULT_TAXONOMY.conversationTypes,
        contextualTags: [...DEFAULT_TAXONOMY.contextualTags, 'custom-context']
      };
      
      expect(customTaxonomy.domains).toContain('custom-domain');
      expect(customTaxonomy.subdomains).toHaveProperty('custom-domain');
      expect(customTaxonomy.contextualTags).toContain('custom-context');
    });
    
    it('can be extended with custom domains and tags', () => {
      // Create an extended taxonomy
      const extendedTaxonomy: Taxonomy = {
        domains: [...DEFAULT_TAXONOMY.domains, 'architecture', 'languages'],
        subdomains: {
          ...DEFAULT_TAXONOMY.subdomains,
          'architecture': ['residential', 'commercial', 'industrial'],
          'languages': ['english', 'spanish', 'mandarin']
        },
        lifeAreas: DEFAULT_TAXONOMY.lifeAreas,
        conversationTypes: DEFAULT_TAXONOMY.conversationTypes,
        contextualTags: DEFAULT_TAXONOMY.contextualTags
      };
      
      expect(extendedTaxonomy.domains).toContain('architecture');
      expect(extendedTaxonomy.domains).toContain('languages');
      expect(extendedTaxonomy.subdomains['architecture']).toContain('residential');
      expect(extendedTaxonomy.subdomains['languages']).toContain('mandarin');
    });
  });
}); 