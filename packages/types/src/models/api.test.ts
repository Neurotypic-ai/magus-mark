import { describe, expect, it } from 'vitest';

import type {
  AIModel,
  APIConfig,
  APIKeyStorage,
  APIRequestTracking,
  APIUsageStats,
  BatchTaggingJob,
  Document,
  RateLimitInfo,
  TaggingOptions,
  TaggingResult,
} from '..';

describe('API Models', () => {
  describe('Basic API Types', () => {
    it('validates AI model type', () => {
      // AIModel is simply a string type
      const model1: AIModel = 'gpt-4o';
      const model2: AIModel = 'gpt-3.5-turbo';
      const model3: AIModel = 'custom-model';

      expect(typeof model1).toBe('string');
      expect(typeof model2).toBe('string');
      expect(typeof model3).toBe('string');
    });

    it('validates API storage locations', () => {
      // APIKeyStorage is a union of literal string types
      const storage1: APIKeyStorage = 'local';
      const storage2: APIKeyStorage = 'system';

      expect(storage1).toBe('local');
      expect(storage2).toBe('system');

      // Type checking - only allowed values should compile
      const validStorageValues: APIKeyStorage[] = ['local', 'system'];
      expect(validStorageValues).toContain(storage1);
    });
  });

  describe('Tagging Types', () => {
    it('validates successful tagging result', () => {
      const result: TaggingResult = {
        success: true,
        tags: {
          year: '2023',
          topical_tags: [
            {
              domain: 'technology',
              subdomain: 'ai',
            },
          ],
          conversation_type: 'deep-dive',
          confidence: {
            overall: 0.9,
            domain: 0.95,
          },
        },
      };

      expect(result.success).toBe(true);
      expect(result.tags).toBeDefined();
      if (result.tags) {
        expect(result.tags.year).toBe('2023');
        expect(result.tags.topical_tags.length).toBeGreaterThan(0);
        expect(result.tags.confidence.overall).toBe(0.9);
      }
      expect(result.error).toBeUndefined();
    });

    it('validates failed tagging result', () => {
      const result: TaggingResult = {
        success: false,
        error: {
          message: 'Failed to process text',
          code: 'PROCESSING_ERROR',
          recoverable: true,
        },
      };

      expect(result.success).toBe(false);
      expect(result.tags).toBeUndefined();
      expect(result.error).toBeDefined();
      if (result.error) {
        expect(result.error.message).toBe('Failed to process text');
        expect(result.error.code).toBe('PROCESSING_ERROR');
        expect(result.error.recoverable).toBe(true);
      }
    });

    it('validates tagging options', () => {
      const options: TaggingOptions = {
        model: 'gpt-4o',
        behavior: 'append',
        minConfidence: 0.6,
        reviewThreshold: 0.8,
        generateExplanations: true,
      };

      expect(options.model).toBe('gpt-4o');
      expect(options.behavior).toBe('append');
      expect(options.minConfidence).toBe(0.6);
      expect(options.reviewThreshold).toBe(0.8);
      expect(options.generateExplanations).toBe(true);

      // Behavior should only allow certain values
      const validBehaviors: TaggingOptions['behavior'][] = ['append', 'replace', 'merge'];
      expect(validBehaviors).toContain(options.behavior);
    });
  });

  describe('Document Type', () => {
    it('validates document object', () => {
      const doc: Document = {
        id: 'doc-123',
        path: '/notes/conversation.md',
        content: 'This is a sample conversation about AI',
        metadata: {
          createdAt: '2023-05-15',
          source: 'chatgpt',
        },
        existingTags: {
          year: '2023',
          topical_tags: [
            {
              domain: 'technology',
            },
          ],
          conversation_type: 'casual',
          confidence: {
            overall: 0.7,
          },
        },
      };

      expect(doc.id).toBe('doc-123');
      expect(doc.path).toBe('/notes/conversation.md');
      expect(doc.content).toBe('This is a sample conversation about AI');
      expect(doc.metadata).toEqual({
        createdAt: '2023-05-15',
        source: 'chatgpt',
      });

      if (doc.existingTags) {
        expect(doc.existingTags.year).toBe('2023');
        expect(doc.existingTags.topical_tags[0]?.domain).toBe('technology');
      }
    });

    it('validates document with minimal fields', () => {
      const doc: Document = {
        id: 'minimal-doc',
        path: '/path/to/doc.md',
        content: 'Minimal content',
        metadata: {},
      };

      expect(doc.id).toBe('minimal-doc');
      expect(doc.path).toBe('/path/to/doc.md');
      expect(doc.content).toBe('Minimal content');
      expect(doc.existingTags).toBeUndefined();
    });
  });

  describe('API Error and Rate Limiting', () => {
    it('validates rate limit info', () => {
      const resetTime = new Date();

      const rateLimitInfo: RateLimitInfo = {
        totalRequests: 100,
        remainingRequests: 75,
        resetTime,
      };

      expect(rateLimitInfo.totalRequests).toBe(100);
      expect(rateLimitInfo.remainingRequests).toBe(75);
      expect(rateLimitInfo.resetTime).toBe(resetTime);
    });
  });

  describe('API Usage and Tracking', () => {
    it('validates API usage stats', () => {
      const stats: APIUsageStats = {
        totalTokens: 1250,
        promptTokens: 750,
        completionTokens: 500,
        cost: 0.025,
        currency: 'USD',
      };

      expect(stats.totalTokens).toBe(1250);
      expect(stats.promptTokens).toBe(750);
      expect(stats.completionTokens).toBe(500);
      expect(stats.cost).toBe(0.025);
      expect(stats.currency).toBe('USD');
    });

    it('validates API request tracking', () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 2000); // 2 seconds later

      const tracking: APIRequestTracking = {
        requestId: 'req-123',
        model: 'gpt-4o',
        startTime,
        endTime,
        status: 'success',
        usage: {
          totalTokens: 1250,
          promptTokens: 750,
          completionTokens: 500,
          cost: 0.025,
          currency: 'USD',
        },
      };

      expect(tracking.requestId).toBe('req-123');
      expect(tracking.model).toBe('gpt-4o');
      expect(tracking.startTime).toBe(startTime);
      expect(tracking.endTime).toBe(endTime);
      expect(tracking.status).toBe('success');
      expect(tracking.usage).toBeDefined();
      if (tracking.usage) {
        expect(tracking.usage.totalTokens).toBe(1250);
      }
    });
  });

  describe('API Configuration', () => {
    it('validates API config', () => {
      const config: APIConfig = {
        apiKey: 'test-api-key',
        apiKeyStorage: 'local',
        organizationId: 'org-123',
        defaultModel: 'gpt-4o',
        timeoutMs: 30000,
        maxRetries: 3,
        costPerTokenMap: {
          'gpt-4o': 0.00005,
          'gpt-4': 0.00003,
          'gpt-3.5-turbo': 0.00001,
        },
      };

      expect(config.apiKey).toBe('test-api-key');
      expect(config.apiKeyStorage).toBe('local');
      expect(config.defaultModel).toBe('gpt-4o');
      expect(config.timeoutMs).toBe(30000);
      expect(config.maxRetries).toBe(3);
      expect(config.costPerTokenMap['gpt-4o']).toBe(0.00005);
    });
  });

  describe('Batch Processing', () => {
    it('validates batch tagging job', () => {
      const job: BatchTaggingJob = {
        id: 'batch-job-1',
        documents: ['doc-1', 'doc-2', 'doc-3'],
        options: {
          model: 'gpt-4o',
          behavior: 'append',
          minConfidence: 0.6,
          reviewThreshold: 0.8,
          generateExplanations: true,
        },
        status: 'processing',
        progress: {
          total: 3,
          completed: 1,
          failed: 0,
        },
        stats: {
          startTime: new Date(),
          totalTokens: 1500,
          totalCost: 0.03,
          currency: 'USD',
        },
      };

      expect(job.id).toBe('batch-job-1');
      expect(job.documents).toHaveLength(3);
      expect(job.options.model).toBe('gpt-4o');
      expect(job.status).toBe('processing');
      expect(job.progress.completed).toBe(1);
      expect(job.stats).toBeDefined();
      if (job.stats) {
        expect(job.stats.totalTokens).toBe(1500);
        expect(job.stats.totalCost).toBe(0.03);
      }
    });
  });
});
