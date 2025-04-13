import { describe, it, expect } from 'vitest';
import {
  // Validators
  yearTagSchema,
  lifeAreaTagSchema,
  domainTagSchema,
  conversationTypeTagSchema,
  confidenceScoreSchema,
  topicalTagSchema,
  tagConfidenceSchema,
  tagSetSchema,
  
  // API validators
  aiModelSchema,
  apiKeyStorageSchema,
  taggingResultSchema,
  taggingOptionsSchema,
  documentSchema
} from '../src';

import type {
  // Tag types
  YearTag,
  LifeAreaTag,
  DomainTag,
  ConversationTypeTag,
  TopicalTag,
  TagConfidence,
  TagSet,
  
  // API types
  AIModel,
  APIKeyStorage,
  TaggingResult,
  TaggingOptions,
  Document
} from '../src';

describe('Tag Types Validation', () => {
  it('validates a valid year tag', () => {
    const validYear: YearTag = '2023';
    expect(yearTagSchema.parse(validYear)).toBe(validYear);
  });

  it('rejects an invalid year tag', () => {
    const invalidYear = '12';
    expect(() => yearTagSchema.parse(invalidYear)).toThrow();
  });

  it('validates a valid life area tag', () => {
    const validLifeArea: LifeAreaTag = 'career';
    expect(lifeAreaTagSchema.parse(validLifeArea)).toBe(validLifeArea);
  });

  it('rejects an invalid life area tag', () => {
    const invalidLifeArea = 'invalid-area';
    expect(() => lifeAreaTagSchema.parse(invalidLifeArea)).toThrow();
  });

  it('validates a valid domain tag', () => {
    const validDomain: DomainTag = 'technology';
    expect(domainTagSchema.parse(validDomain)).toBe(validDomain);
  });

  it('validates a valid conversation type tag', () => {
    const validConversationType: ConversationTypeTag = 'deep-dive';
    expect(conversationTypeTagSchema.parse(validConversationType)).toBe(validConversationType);
  });

  it('validates a valid confidence score', () => {
    const validScore = 0.85;
    expect(confidenceScoreSchema.parse(validScore)).toBe(validScore);
  });

  it('rejects an out-of-range confidence score', () => {
    const invalidScore = 1.5;
    expect(() => confidenceScoreSchema.parse(invalidScore)).toThrow();
  });

  it('validates a valid topical tag', () => {
    const validTopicalTag: TopicalTag = {
      domain: 'technology',
      subdomain: 'ai',
      contextual: 'beginner'
    };
    expect(topicalTagSchema.parse(validTopicalTag)).toEqual(validTopicalTag);
  });

  it('validates a valid tag confidence object', () => {
    const validTagConfidence: TagConfidence = {
      overall: 0.92,
      domain: 0.95,
      subdomain: 0.85,
      conversation_type: 0.90
    };
    expect(tagConfidenceSchema.parse(validTagConfidence)).toEqual(validTagConfidence);
  });

  it('validates a complete tag set', () => {
    const validTagSet: TagSet = {
      year: '2023',
      life_area: 'learning',
      topical_tags: [
        {
          domain: 'technology',
          subdomain: 'ai',
          contextual: 'beginner'
        }
      ],
      conversation_type: 'deep-dive',
      confidence: {
        overall: 0.92,
        domain: 0.95,
        subdomain: 0.85,
        conversation_type: 0.90
      }
    };
    expect(tagSetSchema.parse(validTagSet)).toEqual(validTagSet);
  });
});

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