import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TaggingService } from './TaggingService';
import { TaxonomyManager } from './tagging/TaxonomyManager';

import type { OpenAIClient } from './OpenAIClient';
import type { Document } from './models/api';
import type { TagSet } from './models/tags';

// Create mock functions outside
const mockCreateTaggingPrompt = vi.fn().mockReturnValue('mocked-prompt');
const mockExtractRelevantSections = vi.fn((content: string, size: number) =>
  content.length > size ? content.substring(0, size) : content
);

// Mock dependencies
vi.mock('./openai-client', () => ({
  PromptEngineering: {
    createTaggingPrompt: mockCreateTaggingPrompt,
    extractRelevantSections: mockExtractRelevantSections,
  },
  OpenAIClient: vi.fn(),
}));

vi.mock('./tagging/taxonomy-manager', () => ({
  TaxonomyManager: vi.fn().mockImplementation(() => ({
    getTaxonomyForPrompt: vi.fn().mockReturnValue({ domains: [], lifeAreas: [] }),
  })),
}));

describe('TaggingService', () => {
  let mockOpenAIClient: {
    makeRequest: ReturnType<typeof vi.fn>;
  };
  let taggingService: TaggingService;

  beforeEach(() => {
    mockOpenAIClient = {
      makeRequest: vi.fn(),
    };
    taggingService = new TaggingService(mockOpenAIClient as unknown as OpenAIClient);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options if none provided', () => {
      new TaggingService(mockOpenAIClient as unknown as OpenAIClient);
      expect(TaxonomyManager).toHaveBeenCalledWith(undefined);
      // We can't directly test private properties, but we can test behavior
    });

    it('should merge provided options with defaults', () => {
      const customOptions = { model: 'gpt-3.5-turbo', minConfidence: 0.8 };
      new TaggingService(mockOpenAIClient as unknown as OpenAIClient, customOptions);
      expect(TaxonomyManager).toHaveBeenCalledWith(undefined);
      // Verify behavior that uses these options in later tests
    });

    it('should initialize taxonomy manager with custom taxonomy if provided', () => {
      const customTaxonomy = { domains: ['custom-domain'] };
      new TaggingService(mockOpenAIClient as unknown as OpenAIClient, {}, customTaxonomy);
      expect(TaxonomyManager).toHaveBeenCalledWith(customTaxonomy);
    });
  });

  describe('tagDocument', () => {
    const validDocument: Document = {
      id: 'test-doc',
      path: '/path/to/document.md',
      content: 'This is a test document content for analysis.',
      metadata: {},
    };

    const mockTagSet: TagSet = {
      year: '2024',
      conversation_type: 'analysis',
      topical_tags: [{ domain: 'technology', subdomain: 'software' }],
      confidence: {
        overall: 0.9,
        domain: 0.85,
        life_area: 0.7,
      },
    };

    it('should return error for empty content document', async () => {
      const emptyDocument: Document = {
        ...validDocument,
        content: '',
      };

      const result = await taggingService.tagDocument(emptyDocument);

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Document content is empty',
          code: 'EMPTY_CONTENT',
          recoverable: false,
        },
      });
      expect(mockOpenAIClient.makeRequest).not.toHaveBeenCalled();
    });

    it('should generate tags for valid document', async () => {
      mockOpenAIClient.makeRequest.mockResolvedValueOnce({
        success: true,
        data: { classification: mockTagSet },
      });

      const result = await taggingService.tagDocument(validDocument);

      expect(result.success).toBe(true);
      expect(result.tags).toBeDefined();
      expect(mockCreateTaggingPrompt).toHaveBeenCalled();
      expect(mockOpenAIClient.makeRequest).toHaveBeenCalledWith(
        'mocked-prompt',
        expect.any(String),
        expect.objectContaining({
          temperature: 0.3,
          maxTokens: 1000,
        })
      );
    });

    it('should handle API request failure', async () => {
      mockOpenAIClient.makeRequest.mockResolvedValueOnce({
        success: false,
        error: {
          message: 'API error',
          code: 'API_ERROR',
        },
      });

      const result = await taggingService.tagDocument(validDocument);

      expect(result).toEqual({
        success: false,
        error: {
          message: 'API error',
          code: 'API_ERROR',
          recoverable: true,
        },
      });
    });

    it('should handle unexpected errors', async () => {
      mockOpenAIClient.makeRequest.mockRejectedValueOnce(new Error('Unexpected error'));

      const result = await taggingService.tagDocument(validDocument);

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Unexpected error',
          code: 'UNEXPECTED_ERROR',
          recoverable: false,
        },
      });
    });

    it('should handle long content by extracting relevant sections', async () => {
      const longContent = 'a'.repeat(40000); // Exceeds 32000 chars
      const longDocument = { ...validDocument, content: longContent };

      mockOpenAIClient.makeRequest.mockResolvedValueOnce({
        success: true,
        data: { classification: mockTagSet },
      });

      await taggingService.tagDocument(longDocument);

      expect(mockExtractRelevantSections).toHaveBeenCalledWith(expect.any(String), 8000);
    });
  });

  describe('tag behavior', () => {
    const mockNewTags: TagSet = {
      year: '2024',
      life_area: 'career',
      conversation_type: 'analysis',
      topical_tags: [
        { domain: 'technology', subdomain: 'programming' },
        { domain: 'education', subdomain: 'online-learning' },
      ],
      confidence: {
        overall: 0.9,
        domain: 0.85,
        life_area: 0.7,
      },
    };

    const mockExistingTags: TagSet = {
      year: '2023',
      life_area: 'health',
      conversation_type: 'practical',
      topical_tags: [
        { domain: 'fitness', subdomain: 'weightlifting' },
        { domain: 'technology', subdomain: 'hardware' },
      ],
      confidence: {
        overall: 1.0,
      },
    };

    const validDocument: Document = {
      id: 'test-doc',
      path: '/path/to/document.md',
      content: 'This is a test document content for analysis.',
      metadata: {},
      existingTags: mockExistingTags,
    };

    it('should replace existing tags when in replace mode', async () => {
      const replaceService = new TaggingService(mockOpenAIClient as unknown as OpenAIClient, {
        behavior: 'replace',
      });

      mockOpenAIClient.makeRequest.mockResolvedValueOnce({
        success: true,
        data: { classification: mockNewTags },
      });

      const result = await replaceService.tagDocument(validDocument);

      expect(result.success).toBe(true);
      expect(result.tags).toEqual(mockNewTags); // Complete replacement
    });

    it('should append non-conflicting tags when in append mode', async () => {
      const appendService = new TaggingService(mockOpenAIClient as unknown as OpenAIClient, {
        behavior: 'append',
      });

      mockOpenAIClient.makeRequest.mockResolvedValueOnce({
        success: true,
        data: { classification: mockNewTags },
      });

      const result = await appendService.tagDocument(validDocument);

      expect(result.success).toBe(true);
      expect(result.tags).toBeDefined();

      // Check that year and conversation type are from new tags
      expect(result.tags?.year).toBe(mockNewTags.year);
      expect(result.tags?.conversation_type).toBe(mockNewTags.conversation_type);

      // Life area is kept from existing since it's present
      expect(result.tags?.life_area).toBe(mockExistingTags.life_area);

      // Should have combined topical tags (ensure the count is right)
      expect(result.tags?.topical_tags).toHaveLength(
        mockExistingTags.topical_tags.length + 1 // +1 because "education" is new, but "technology" exists in both
      );
    });

    it('should merge tags with preference for high confidence tags', async () => {
      const mergeService = new TaggingService(mockOpenAIClient as unknown as OpenAIClient, {
        behavior: 'merge',
        reviewThreshold: 0.8,
      });

      mockOpenAIClient.makeRequest.mockResolvedValueOnce({
        success: true,
        data: { classification: mockNewTags },
      });

      const result = await mergeService.tagDocument(validDocument);

      expect(result.success).toBe(true);
      expect(result.tags).toBeDefined();

      // Life area confidence is below review threshold, so existing is kept
      expect(result.tags?.life_area).toBe(mockExistingTags.life_area);

      // Should have merged topical tags
      expect(result.tags?.topical_tags).toContainEqual(expect.objectContaining({ domain: 'education' }));
      expect(result.tags?.topical_tags).toContainEqual(expect.objectContaining({ domain: 'fitness' }));
    });
  });

  describe('confidence thresholds', () => {
    it('should filter out low confidence tags', async () => {
      const lowConfidenceTags: TagSet = {
        year: '2024',
        life_area: 'career',
        conversation_type: 'practical',
        topical_tags: [
          { domain: 'technology', subdomain: 'programming' },
          { domain: 'education', subdomain: 'online-learning' },
        ],
        confidence: {
          overall: 0.7,
          domain: 0.6, // Below default threshold of 0.65
          life_area: 0.3, // Well below threshold
        },
      };

      mockOpenAIClient.makeRequest.mockResolvedValueOnce({
        success: true,
        data: { classification: lowConfidenceTags },
      });

      const validDocument: Document = {
        id: 'test-doc',
        path: '/path/to/document.md',
        content: 'This is a test document content for analysis.',
        metadata: {},
      };

      const result = await taggingService.tagDocument(validDocument);

      expect(result.success).toBe(true);
      expect(result.tags).toBeDefined();
      expect(result.tags?.life_area).toBeUndefined(); // Filtered out due to low confidence
      expect(result.tags?.topical_tags).toHaveLength(0); // Filtered out due to low domain confidence
    });
  });
});
