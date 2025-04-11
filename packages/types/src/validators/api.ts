/**
 * Zod validators for API type definitions
 */

import { z } from 'zod';

import { tagSetSchema } from './tags';

// Basic API validators
export const aiModelSchema = z.string();

export const apiKeyStorageSchema = z.enum(['local', 'system']);

export const taggingResultSchema = z.object({
  success: z.boolean(),
  tags: tagSetSchema.optional(),
  error: z
    .object({
      message: z.string(),
      code: z.string(),
      recoverable: z.boolean(),
    })
    .optional(),
});

export const taggingOptionsSchema = z.object({
  model: aiModelSchema,
  behavior: z.enum(['append', 'replace', 'merge']),
  minConfidence: z.number().min(0).max(1),
  reviewThreshold: z.number().min(0).max(1),
  generateExplanations: z.boolean(),
});

export const documentSchema = z.object({
  id: z.string(),
  path: z.string(),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  existingTags: tagSetSchema.optional(),
});

// Advanced API validators
export const rateLimitInfoSchema = z.object({
  totalRequests: z.number().int().positive(),
  remainingRequests: z.number().int().nonnegative(),
  resetTime: z.date(),
});

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  recoverable: z.boolean(),
  rateLimitInfo: rateLimitInfoSchema.optional(),
});

export const apiUsageStatsSchema = z.object({
  totalTokens: z.number().int().nonnegative(),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  cost: z.number().nonnegative(),
  currency: z.literal('USD'),
});

export const apiRequestTrackingSchema = z.object({
  requestId: z.string(),
  model: aiModelSchema,
  startTime: z.date(),
  endTime: z.date().optional(),
  status: z.enum(['pending', 'success', 'error']),
  usage: apiUsageStatsSchema.optional(),
  error: apiErrorSchema.optional(),
});

export const apiConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key cannot be empty'),
  apiKeyStorage: apiKeyStorageSchema,
  organizationId: z.string().optional(),
  defaultModel: aiModelSchema,
  timeoutMs: z.number().int().positive(),
  maxRetries: z.number().int().nonnegative(),
  costPerTokenMap: z.record(z.number().nonnegative()),
});

export const batchTaggingJobSchema = z.object({
  id: z.string(),
  documents: z.array(z.string()),
  options: taggingOptionsSchema,
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  progress: z.object({
    total: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
  stats: z
    .object({
      startTime: z.date(),
      endTime: z.date().optional(),
      totalTokens: z.number().int().nonnegative(),
      totalCost: z.number().nonnegative(),
      currency: z.literal('USD'),
    })
    .optional(),
});

// Type inference helpers
export type AIModelSchema = z.infer<typeof aiModelSchema>;
export type APIKeyStorageSchema = z.infer<typeof apiKeyStorageSchema>;
export type TaggingResultSchema = z.infer<typeof taggingResultSchema>;
export type TaggingOptionsSchema = z.infer<typeof taggingOptionsSchema>;
export type DocumentSchema = z.infer<typeof documentSchema>;
export type RateLimitInfoSchema = z.infer<typeof rateLimitInfoSchema>;
export type APIErrorSchema = z.infer<typeof apiErrorSchema>;
export type APIUsageStatsSchema = z.infer<typeof apiUsageStatsSchema>;
export type APIRequestTrackingSchema = z.infer<typeof apiRequestTrackingSchema>;
export type APIConfigSchema = z.infer<typeof apiConfigSchema>;
export type BatchTaggingJobSchema = z.infer<typeof batchTaggingJobSchema>;
