/**
 * API and operational type definitions for Obsidian Magic
 */

import type { TagBehavior, TagSet } from './tags';

/**
 * OpenAI model options - dynamically determined at runtime
 */
export type AIModel = string;

/**
 * API key storage location
 */
export type APIKeyStorage = 'local' | 'system';

/**
 * Result of a tagging operation
 */
export interface TaggingResult {
  success: boolean;
  tags?: TagSet;
  error?: {
    message: string;
    code: string;
    recoverable: boolean;
  };
}

/**
 * Options for tagging operations
 */
export interface TaggingOptions {
  model: AIModel;
  behavior: TagBehavior;
  minConfidence: number;
  reviewThreshold: number;
  generateExplanations: boolean;
}

/**
 * Document representing a conversation to be tagged
 */
export interface Document {
  id: string;
  path: string;
  content: string;
  metadata: Record<string, unknown>;
  existingTags?: TagSet | undefined;
}

/**
 * API rate limiting information
 */
export interface RateLimitInfo {
  totalRequests: number;
  remainingRequests: number;
  resetTime: Date;
}

/**
 * API usage statistics
 */
export interface APIUsageStats {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  currency: 'USD';
}

/**
 * API request tracking information
 */
export interface APIRequestTracking {
  requestId: string;
  model: AIModel;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'success' | 'error';
  usage?: APIUsageStats;
  error?: Error;
}

/**
 * Authentication and API configuration
 */
export interface APIConfig {
  apiKey: string;
  apiKeyStorage: APIKeyStorage;
  organizationId?: string;
  defaultModel: AIModel;
  timeoutMs: number;
  maxRetries: number;
  costPerTokenMap: Record<AIModel, number>;
}

/**
 * Batch tagging job configuration
 */
export interface BatchTaggingJob {
  id: string;
  documents: string[];
  options: TaggingOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  stats?: {
    startTime: Date;
    endTime?: Date;
    totalTokens: number;
    totalCost: number;
    currency: 'USD';
  };
}
