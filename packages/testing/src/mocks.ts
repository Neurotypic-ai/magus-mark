/**
 * Mock utilities for testing
 */

import type { OpenAIConfig, OpenAIResponse, TagSet } from '@obsidian-magic/types';

/**
 * Creates a mock TagSet for testing
 * @param overrides - Optional overrides for the default values
 * @returns A mock TagSet
 */
export function createMockTagSet(overrides: Partial<TagSet> = {}): TagSet {
  return {
    year: '2023',
    life_area: 'projects',
    topical_tags: [{ domain: 'software-development', subdomain: 'frontend' }, { contextual: 'performance' }],
    conversation_type: 'practical',
    confidence: {
      overall: 0.95,
      year: 0.7,
      life_area: 0.85,
      domain: 0.98,
      subdomain: 0.96,
      contextual: 0.92,
      conversation_type: 0.97,
    },
    explanations: {
      domain: 'This conversation is about optimizing React performance.',
      year: 'Based on the mentions of modern React techniques.',
      life_area: 'This appears to be a project-related conversation.',
    },
    ...overrides,
  };
}

/**
 * Creates mock OpenAI configuration for testing
 * @param overrides - Optional overrides for the default values
 * @returns Mock OpenAI configuration
 */
export function createMockOpenAIConfig(overrides: Partial<OpenAIConfig> = {}): OpenAIConfig {
  return {
    apiKey: 'test-api-key',
    model: 'gpt-4o',
    maxRetries: 3,
    initialRetryDelay: 1000,
    maxRetryDelay: 60000,
    backoffFactor: 2,
    timeout: 30000,
    enableModeration: false,
    ...overrides,
  };
}

/**
 * Creates a mock successful API response
 * @param data - The data to include in the response
 * @returns A successful mock API response
 */
export function createMockSuccessResponse<T>(data: T): OpenAIResponse<T> {
  return {
    success: true,
    data,
    usage: {
      promptTokens: 150,
      completionTokens: 100,
      totalTokens: 250,
      estimatedCost: 0.0025,
    },
  };
}

/**
 * Creates a mock error API response
 * @param message - The error message
 * @param code - The error code
 * @returns An error mock API response
 */
export function createMockErrorResponse<T>(message = 'An error occurred', code = 'ERROR'): OpenAIResponse<T> {
  return {
    success: false,
    error: {
      message,
      code,
    },
  };
}

/**
 * Creates a mock rate limit error response
 * @param retryAfter - Seconds to wait before retrying
 * @returns A rate limit error mock response
 */
export function createMockRateLimitResponse<T>(retryAfter = 60): OpenAIResponse<T> {
  return {
    success: false,
    error: {
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
      statusCode: 429,
    },
  };
}
