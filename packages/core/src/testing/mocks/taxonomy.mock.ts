import { vi } from 'vitest';

/**
 * Creates a mock for the TaxonomyManager
 */
export const mockTaxonomyManager = () => {
  return {
    TaxonomyManager: vi.fn().mockImplementation(() => ({
      getInstance: vi.fn().mockImplementation(() => ({
        validateTaxonomy: vi.fn().mockImplementation(() => true),
        validateDomain: vi.fn().mockImplementation(() => true),
        validateSubdomain: vi.fn().mockImplementation(() => true),
        validateLifeArea: vi.fn().mockImplementation(() => true),
        validateContextualTag: vi.fn().mockImplementation(() => true),
        validateConversationType: vi.fn().mockImplementation(() => true),
        getStandardTaxonomy: vi.fn().mockImplementation(() => ({
          domains: [
            'technology',
            'health',
            'business',
            'arts',
            'science',
            'lifestyle',
            'education',
            'travel',
            'sports',
            'entertainment',
            'software-development',
          ],
          subdomains: {
            technology: ['programming', 'hardware', 'software', 'ai', 'data-science'],
            'software-development': ['frontend', 'backend', 'devops', 'mobile', 'web'],
          },
          lifeAreas: [
            'health',
            'learning',
            'work',
            'finance',
            'relationships',
            'personal-growth',
            'recreation',
            'spirituality',
          ],
          contextualTags: [
            'tutorial',
            'guide',
            'reference',
            'project',
            'brainstorming',
            'debug',
            'explanation',
            'summary',
          ],
          conversationTypes: ['exploration', 'practical', 'creative', 'philosophical', 'instructional'],
        })),
        getTaxonomyPrompt: vi.fn().mockImplementation(() => 'Taxonomy prompt for classification'),
      })),
    })),
  };
};
