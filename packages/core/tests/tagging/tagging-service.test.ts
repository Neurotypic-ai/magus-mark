import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TaggingService, DEFAULT_TAGGING_OPTIONS } from '../../src/tagging';
import { TaxonomyManager } from '../../src/tagging/taxonomy';
import type { Document, TagSet, TaggingOptions } from '@obsidian-magic/types';

// Mock the OpenAI client and prompt engineering
vi.mock('../../src/openai', () => {
  return {
    PromptEngineering: {
      createTaggingPrompt: vi.fn().mockReturnValue('mock tagging prompt'),
      extractRelevantSections: vi.fn((content) => content.substring(0, 1000))
    }
  };
});

// Mock the taxonomy manager
vi.mock('../../src/tagging/taxonomy', () => {
  return {
    TaxonomyManager: vi.fn().mockImplementation(() => ({
      getTaxonomyForPrompt: vi.fn().mockReturnValue({
        years: ['2020', '2021', '2022', '2023'],
        life_areas: ['work', 'learning', 'personal'],
        domains: {
          'software-development': {
            subdomains: ['frontend', 'backend', 'devops']
          },
          'programming': {
            subdomains: ['javascript', 'python', 'typescript']
          }
        },
        conversation_types: ['practical', 'conceptual', 'creative']
      })
    }))
  };
});

describe('TaggingService', () => {
  // Sample document for testing
  const sampleDocument: Document = {
    id: 'test-doc-1',
    path: '/path/to/document.md',
    content: 'This is a test document about React Hooks and TypeScript',
    metadata: {
      created: '2023-01-01',
      modified: '2023-01-02',
      source: 'test'
    }
  };

  // Sample successful response from OpenAI
  const successfulResponse = {
    success: true,
    data: {
      classification: {
        year: '2023',
        life_area: 'learning',
        topical_tags: [
          { domain: 'software-development', subdomain: 'frontend' },
          { domain: 'programming', contextual: 'tutorial' }
        ],
        conversation_type: 'practical',
        confidence: {
          overall: 0.92,
          year: 0.95,
          life_area: 0.85,
          domain: 0.93,
          subdomain: 0.90,
          contextual: 0.87,
          conversation_type: 0.91
        },
        explanations: {
          contextual_tag: 'Selected "tutorial" because the content discusses learning React hooks.'
        }
      }
    },
    usage: {
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
      estimatedCost: 0.015
    }
  };

  // Mock OpenAI client
  const mockOpenAIClient = {
    makeRequest: vi.fn().mockResolvedValue(successfulResponse),
    setApiKey: vi.fn(),
    setModel: vi.fn(),
    estimateTokenCount: vi.fn().mockReturnValue(100)
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options when no options provided', () => {
      const service = new TaggingService(mockOpenAIClient);
      expect(service.options).toEqual(DEFAULT_TAGGING_OPTIONS);
      expect(TaxonomyManager).toHaveBeenCalled();
    });

    it('should merge provided options with defaults', () => {
      const customOptions: Partial<TaggingOptions> = {
        model: 'gpt-4-turbo',
        minConfidence: 0.75
      };
      
      const service = new TaggingService(mockOpenAIClient, customOptions);
      expect(service.options.model).toBe('gpt-4-turbo');
      expect(service.options.minConfidence).toBe(0.75);
      expect(service.options.behavior).toBe(DEFAULT_TAGGING_OPTIONS.behavior);
    });

    it('should use custom taxonomy if provided', () => {
      const customTaxonomy = {
        years: ['2020', '2021'],
        life_areas: ['custom-area']
      };
      
      const service = new TaggingService(mockOpenAIClient, {}, customTaxonomy);
      expect(TaxonomyManager).toHaveBeenCalledWith(customTaxonomy);
    });
  });

  describe('tagDocument', () => {
    it('should return error for empty document content', async () => {
      const service = new TaggingService(mockOpenAIClient);
      const emptyDocument = { ...sampleDocument, content: '' };
      
      const result = await service.tagDocument(emptyDocument);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMPTY_CONTENT');
      expect(mockOpenAIClient.makeRequest).not.toHaveBeenCalled();
    });

    it('should make OpenAI request with proper parameters', async () => {
      const service = new TaggingService(mockOpenAIClient);
      const result = await service.tagDocument(sampleDocument);
      
      expect(mockOpenAIClient.makeRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('precise conversation classifier'),
        expect.objectContaining({
          temperature: 0.3,
          maxTokens: 1000
        })
      );
    });

    it('should return successful result with tags from API response', async () => {
      const service = new TaggingService(mockOpenAIClient);
      const result = await service.tagDocument(sampleDocument);
      
      expect(result.success).toBe(true);
      expect(result.tags).toBeDefined();
      expect(result.tags?.year).toBe('2023');
      expect(result.tags?.life_area).toBe('learning');
      expect(result.tags?.topical_tags).toHaveLength(2);
      expect(result.tags?.conversation_type).toBe('practical');
    });

    it('should handle API errors gracefully', async () => {
      mockOpenAIClient.makeRequest.mockResolvedValueOnce({
        success: false,
        error: {
          message: 'API Error',
          code: 'API_ERROR'
        }
      });
      
      const service = new TaggingService(mockOpenAIClient);
      const result = await service.tagDocument(sampleDocument);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('API_ERROR');
      expect(result.tags).toBeUndefined();
    });

    it('should handle unexpected errors and convert to TaggingResult', async () => {
      mockOpenAIClient.makeRequest.mockRejectedValueOnce(new Error('Unexpected error'));
      
      const service = new TaggingService(mockOpenAIClient);
      const result = await service.tagDocument(sampleDocument);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Unexpected error');
      expect(result.error?.code).toBe('UNEXPECTED_ERROR');
    });
  });

  describe('processTagsWithConfidence', () => {
    it('should filter out low confidence tags', () => {
      const service = new TaggingService(mockOpenAIClient, { minConfidence: 0.85 });
      
      const inputTags: TagSet = {
        year: '2023',
        life_area: 'learning',
        topical_tags: [
          { domain: 'software-development', subdomain: 'frontend' },
          { domain: 'programming', contextual: 'tutorial' }
        ],
        conversation_type: 'practical',
        confidence: {
          overall: 0.9,
          year: 0.95,
          life_area: 0.8, // Below threshold
          domain: 0.93,
          conversation_type: 0.91
        }
      };
      
      const processedTags = service.processTagsWithConfidence(inputTags);
      
      expect(processedTags.year).toBe('2023');
      expect(processedTags.life_area).toBeUndefined(); // Filtered out
      expect(processedTags.topical_tags).toHaveLength(inputTags.topical_tags.length);
      expect(processedTags.conversation_type).toBe('practical');
    });

    it('should keep explanations only for medium confidence tags when enabled', () => {
      const service = new TaggingService(mockOpenAIClient, { 
        minConfidence: 0.7,
        reviewThreshold: 0.9,
        generateExplanations: true
      });
      
      const inputTags: TagSet = {
        year: '2023',
        life_area: 'learning',
        topical_tags: [
          { domain: 'software-development', subdomain: 'frontend' }
        ],
        conversation_type: 'practical',
        confidence: {
          overall: 0.9,
          year: 0.95, // High confidence
          life_area: 0.8, // Medium confidence
          domain: 0.75, // Medium confidence
          conversation_type: 0.91 // High confidence
        },
        explanations: {
          year: 'Year explanation',
          life_area: 'Life area explanation',
          domain: 'Domain explanation',
          contextual_tag: 'Contextual tag explanation'
        }
      };
      
      const processedTags = service.processTagsWithConfidence(inputTags);
      
      expect(processedTags.explanations).toBeDefined();
      expect(processedTags.explanations?.year).toBeUndefined(); // High confidence, no explanation needed
      expect(processedTags.explanations?.life_area).toBe('Life area explanation'); // Medium confidence
      expect(processedTags.explanations?.domain).toBe('Domain explanation'); // Medium confidence
      expect(processedTags.explanations?.contextual_tag).toBe('Contextual tag explanation'); // Always keep contextual
    });

    it('should remove all explanations when generateExplanations is false', () => {
      const service = new TaggingService(mockOpenAIClient, { generateExplanations: false });
      
      const inputTags: TagSet = {
        year: '2023',
        life_area: 'learning',
        topical_tags: [],
        conversation_type: 'practical',
        confidence: { overall: 0.9 },
        explanations: {
          life_area: 'Life area explanation'
        }
      };
      
      const processedTags = service.processTagsWithConfidence(inputTags);
      
      expect(processedTags.explanations).toBeUndefined();
    });
  });

  describe('applyTagBehavior', () => {
    const existingTags: TagSet = {
      year: '2022',
      life_area: 'work',
      topical_tags: [
        { domain: 'business', subdomain: 'management' }
      ],
      conversation_type: 'conceptual',
      confidence: { overall: 0.9 }
    };
    
    const newTags: TagSet = {
      year: '2023',
      life_area: 'learning',
      topical_tags: [
        { domain: 'software-development', subdomain: 'frontend' }
      ],
      conversation_type: 'practical',
      confidence: { overall: 0.9 }
    };
    
    it('should replace all tags in replace mode', () => {
      const service = new TaggingService(mockOpenAIClient, { behavior: 'replace' });
      
      const result = service.applyTagBehavior(newTags, existingTags);
      
      expect(result).toBe(newTags);
      expect(result).not.toBe(existingTags);
    });
    
    it('should use new tags when no existing tags provided', () => {
      const service = new TaggingService(mockOpenAIClient, { behavior: 'merge' });
      
      const result = service.applyTagBehavior(newTags);
      
      expect(result).toBe(newTags);
    });
    
    it('should append new topical tags to existing ones in append mode', () => {
      const service = new TaggingService(mockOpenAIClient, { behavior: 'append' });
      
      const result = service.applyTagBehavior(newTags, existingTags);
      
      // Always overwrite year and conversation_type
      expect(result.year).toBe(newTags.year);
      expect(result.conversation_type).toBe(newTags.conversation_type);
      
      // Keep existing life_area
      expect(result.life_area).toBe(existingTags.life_area);
      
      // Combine topical tags
      expect(result.topical_tags).toHaveLength(
        existingTags.topical_tags.length + newTags.topical_tags.length
      );
      expect(result.topical_tags).toContainEqual(existingTags.topical_tags[0]);
      expect(result.topical_tags).toContainEqual(newTags.topical_tags[0]);
    });
    
    it('should merge tags intelligently in merge mode', () => {
      const service = new TaggingService(mockOpenAIClient, { behavior: 'merge' });
      
      const result = service.applyTagBehavior(newTags, existingTags);
      
      // Overwrite with higher confidence values
      expect(result.year).toBe(newTags.year);
      expect(result.conversation_type).toBe(newTags.conversation_type);
      
      // Use new life_area in merge mode
      expect(result.life_area).toBe(newTags.life_area);
      
      // Merge topical tags with deduplication
      expect(result.topical_tags).toContainEqual(newTags.topical_tags[0]);
      expect(result.topical_tags).toHaveLength(
        // Both sets of topical tags in merge mode
        newTags.topical_tags.length + existingTags.topical_tags.length
      );
    });
  });
}); 