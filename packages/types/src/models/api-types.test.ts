import { describe, it, expect } from 'vitest';
import {
  aiModelSchema,
  apiKeyStorageSchema,
  taggingResultSchema,
  taggingOptionsSchema,
  documentSchema
} from '..';

import type {
  AIModel,
  APIKeyStorage,
  TaggingResult,
  TaggingOptions,
  Document
} from '..';

describe('API Types Validation', () => {
  it('validates a valid AI model', () => {
    const validModel: AIModel = 'gpt-4o';
    expect(aiModelSchema.parse(validModel)).toBe(validModel);
  });

  it('validates a valid API key storage option', () => {
    const validStorage: APIKeyStorage = 'local';
    expect(apiKeyStorageSchema.parse(validStorage)).toBe(validStorage);
  });

  it('validates a valid tagging result', () => {
    const validTaggingResult: TaggingResult = {
      success: true,
      tags: {
        year: '2023',
        topical_tags: [
          {
            domain: 'technology',
            subdomain: 'ai'
          }
        ],
        conversation_type: 'deep-dive',
        confidence: {
          overall: 0.92
        }
      }
    };
    expect(taggingResultSchema.parse(validTaggingResult)).toEqual(validTaggingResult);
  });

  it('validates a valid tagging options object', () => {
    const validTaggingOptions: TaggingOptions = {
      model: 'gpt-4o',
      behavior: 'append',
      minConfidence: 0.6,
      reviewThreshold: 0.8,
      generateExplanations: true
    };
    expect(taggingOptionsSchema.parse(validTaggingOptions)).toEqual(validTaggingOptions);
  });

  it('validates a valid document object', () => {
    const validDocument: Document = {
      id: 'doc123',
      path: '/notes/conversation.md',
      content: 'This is a sample conversation',
      metadata: {
        createdAt: '2023-01-01',
        source: 'chatgpt'
      }
    };
    expect(documentSchema.parse(validDocument)).toEqual(validDocument);
  });
}); 