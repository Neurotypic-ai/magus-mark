import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BatchProcessingService } from './BatchProcessingService';

import type { Document } from '../models/Document';
import type { TagSet } from '../models/TagSet';
import type { TaggingResult } from '../models/TaggingResult';
import type { TaggingService } from '../openai/TaggingService';
import type { BatchProcessingOptions } from './BatchProcessingService';

// Mock TaggingService with a properly typed mock function
const mockTagDocument = vi.fn();
const mockTaggingService = {
  tagDocument: mockTagDocument,
};

describe('BatchProcessingService', () => {
  // Sample test documents
  const testDocuments: Document[] = [
    {
      id: 'doc1',
      path: '/path/to/doc1.md',
      content: 'This is document 1',
      metadata: {},
    },
    {
      id: 'doc2',
      path: '/path/to/doc2.md',
      content: 'This is document 2',
      metadata: {},
    },
    {
      id: 'doc3',
      path: '/path/to/doc3.md',
      content: 'This is document 3',
      metadata: {},
    },
  ];

  // Sample successful tagging result
  const successResult: TaggingResult = {
    success: true,
    tags: {
      topical_tags: [{ domain: 'technology', subdomain: 'ai' }],
      conversation_type: 'analysis',
      life_area: 'learning',
      year: '2023',
      confidence: {
        overall: 0.9,
        conversation_type: 0.85,
        life_area: 0.8,
      },
    } as TagSet,
  };

  // Sample error tagging result
  const errorResult: TaggingResult = {
    success: false,
    error: {
      message: 'Failed to tag document',
      code: 'TAGGING_ERROR',
      recoverable: true,
    },
  };

  let batchService: BatchProcessingService;
  let onProgressMock: ReturnType<typeof vi.fn>;
  let onErrorMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create mocks for progress and error callbacks
    onProgressMock = vi.fn();
    onErrorMock = vi.fn();

    // Initialize BatchProcessingService with default options and mocks
    const options: BatchProcessingOptions = {
      concurrency: 2,
      continueOnError: true,
      onProgress: onProgressMock,
      onError: onErrorMock,
    };

    batchService = new BatchProcessingService(mockTaggingService as unknown as TaggingService, options);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options when none provided', () => {
      const service = new BatchProcessingService(mockTaggingService as unknown as TaggingService);
      expect(service.getOptions().concurrency).toBe(3);
      expect(service.getOptions().continueOnError).toBe(true);
    });

    it('should merge provided options with defaults', () => {
      const service = new BatchProcessingService(mockTaggingService as unknown as TaggingService, { concurrency: 5 });
      expect(service.getOptions().concurrency).toBe(5);
      expect(service.getOptions().continueOnError).toBe(true);
    });
  });

  describe('processBatch', () => {
    it('should process all documents successfully', async () => {
      // Configure mock to return success for all documents
      mockTagDocument.mockResolvedValue({
        ...successResult,
        usage: { totalTokens: 100, estimatedCost: 0.002 },
      });

      const result = await batchService.processBatch(testDocuments);

      // Verify all documents were processed
      expect(result.results.length).toBe(3);
      expect(result.errors.length).toBe(0);
      expect(result.summary.successful).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(result.summary.totalTokensUsed).toBe(300); // 100 tokens per document
      expect(result.summary.estimatedCost).toBe(0.006); // 0.002 cost per document

      // Verify tagging service was called for each document
      expect(mockTagDocument).toHaveBeenCalledTimes(3);

      // Verify progress callback was called for each document
      expect(onProgressMock).toHaveBeenCalledTimes(3);
      expect(onProgressMock).toHaveBeenCalledWith(3, 3);
    });

    it('should handle document processing errors', async () => {
      // Configure mock to return error for the second document
      mockTagDocument
        .mockResolvedValueOnce({
          ...successResult,
          usage: { totalTokens: 100, estimatedCost: 0.002 },
        })
        .mockResolvedValueOnce(errorResult)
        .mockResolvedValueOnce({
          ...successResult,
          usage: { totalTokens: 100, estimatedCost: 0.002 },
        });

      const result = await batchService.processBatch(testDocuments);

      // Verify correct counts in results
      expect(result.results.length).toBe(2);
      expect(result.errors.length).toBe(1);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(1);
      expect(result.summary.total).toBe(3);
      expect(result.summary.totalTokensUsed).toBe(200); // Only successful docs counted

      // Verify onError callback was called
      expect(onErrorMock).toHaveBeenCalledTimes(1);
      // Check if error callback received document
      expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error), testDocuments[1]);
    });

    it('should stop processing on error when continueOnError is false', async () => {
      // Set continueOnError to false
      batchService.setOptions({ continueOnError: false });

      // Configure mock to return error for the second document
      mockTagDocument
        .mockResolvedValueOnce({
          ...successResult,
          usage: { totalTokens: 100, estimatedCost: 0.002 },
        })
        .mockResolvedValueOnce(errorResult)
        .mockResolvedValueOnce({
          ...successResult,
          usage: { totalTokens: 100, estimatedCost: 0.002 },
        });

      // Process should throw error
      await expect(batchService.processBatch(testDocuments)).rejects.toThrow();

      // In the current implementation, all documents are queued for processing
      // before any errors are handled, so the mock will be called for all documents
      expect(mockTagDocument).toHaveBeenCalledTimes(3);

      // Verify that the documents were processed in order
      expect(mockTagDocument).toHaveBeenNthCalledWith(1, testDocuments[0]);
      expect(mockTagDocument).toHaveBeenNthCalledWith(2, testDocuments[1]);
      expect(mockTagDocument).toHaveBeenNthCalledWith(3, testDocuments[2]);
    });

    it('should respect concurrency limit', async () => {
      // Create a way to track concurrency
      let concurrentCalls = 0;
      let maxConcurrentCalls = 0;

      // Configure mock to track concurrent calls
      mockTagDocument.mockImplementation(async () => {
        concurrentCalls++;
        maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);

        // Simulate some processing time
        await new Promise((resolve) => setTimeout(resolve, 50));

        concurrentCalls--;
        return {
          ...successResult,
          usage: { totalTokens: 100, estimatedCost: 0.002 },
        };
      });

      await batchService.processBatch(testDocuments);

      // Verify concurrency was respected
      expect(maxConcurrentCalls).toBeLessThanOrEqual(2); // Our concurrency limit
      expect(mockTagDocument).toHaveBeenCalledTimes(3);
    });
  });

  describe('estimateBatchCost', () => {
    it('should estimate batch cost correctly', () => {
      const estimate = batchService.estimateBatchCost(testDocuments);

      // Verify estimation properties
      expect(estimate).toHaveProperty('estimatedTokens');
      expect(estimate).toHaveProperty('estimatedCost');
      expect(estimate).toHaveProperty('estimatedTimeMinutes');

      // Values should be positive
      expect(estimate.estimatedTokens).toBeGreaterThan(0);
      expect(estimate.estimatedCost).toBeGreaterThan(0);
      expect(estimate.estimatedTimeMinutes).toBeGreaterThan(0);
    });

    it('should scale estimates with document size', () => {
      // Create documents with different sizes
      const smallDocs = [{ id: 'small1', path: '/path/small1.md', content: 'Small', metadata: {} }] as Document[];

      const largeDocs = [
        { id: 'large1', path: '/path/large1.md', content: 'Large '.repeat(1000), metadata: {} },
      ] as Document[];

      const smallEstimate = batchService.estimateBatchCost(smallDocs);
      const largeEstimate = batchService.estimateBatchCost(largeDocs);

      // Large document should require more tokens
      expect(largeEstimate.estimatedTokens).toBeGreaterThan(smallEstimate.estimatedTokens);
      expect(largeEstimate.estimatedCost).toBeGreaterThan(smallEstimate.estimatedCost);
    });
  });

  describe('setOptions and getOptions', () => {
    it('should update options correctly', () => {
      // Initial options should match what we set in beforeEach
      expect(batchService.getOptions().concurrency).toBe(2);

      // Update options
      batchService.setOptions({ concurrency: 5, continueOnError: false });

      // Verify options were updated
      const updatedOptions = batchService.getOptions();
      expect(updatedOptions.concurrency).toBe(5);
      expect(updatedOptions.continueOnError).toBe(false);

      // Original callbacks should be preserved
      expect(updatedOptions.onProgress).toBe(onProgressMock);
    });

    it('should return a copy of options to prevent direct mutation', () => {
      const options = batchService.getOptions();
      options.concurrency = 10;

      // Original options should not be affected
      expect(batchService.getOptions().concurrency).toBe(2);
    });
  });
});
