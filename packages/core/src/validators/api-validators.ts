/**
 * Zod validators for API type definitions
 */

import { z } from 'zod';

import { tagSetSchema } from './tags-validators';

// Basic API validators
export const aiModelSchema: z.ZodString = z.string();

export const apiKeyStorageSchema: z.ZodType<'local' | 'system'> = z.enum(['local', 'system'] as const);

export const taggingResultSchema: z.ZodObject<{
  success: z.ZodBoolean;
  tags: z.ZodOptional<typeof tagSetSchema>;
  error: z.ZodOptional<
    z.ZodObject<{
      message: z.ZodString;
      code: z.ZodString;
      recoverable: z.ZodBoolean;
    }>
  >;
}> = z.object({
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

export const taggingOptionsSchema: ReturnType<typeof z.object> = z.object({
  model: aiModelSchema,
  behavior: z.enum(['append', 'replace', 'merge'] as const),
  minConfidence: z.number().min(0).max(1),
  reviewThreshold: z.number().min(0).max(1),
  generateExplanations: z.boolean(),
  taxonomy: tagSetSchema.optional(),
});

export const documentSchema: ReturnType<typeof z.object> = z.object({
  id: z.string(),
  path: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  existingTags: tagSetSchema.optional(),
});

// Advanced API validators
export const rateLimitInfoSchema: z.ZodObject<{
  totalRequests: z.ZodNumber;
  remainingRequests: z.ZodNumber;
  resetTime: z.ZodDate;
}> = z.object({
  totalRequests: z.number().int().positive(),
  remainingRequests: z.number().int().nonnegative(),
  resetTime: z.date(),
});

export const apiErrorSchema: z.ZodObject<{
  code: z.ZodString;
  message: z.ZodString;
  recoverable: z.ZodBoolean;
  rateLimitInfo: z.ZodOptional<typeof rateLimitInfoSchema>;
}> = z.object({
  code: z.string(),
  message: z.string(),
  recoverable: z.boolean(),
  rateLimitInfo: rateLimitInfoSchema.optional(),
});

export const apiUsageStatsSchema: z.ZodObject<{
  totalTokens: z.ZodNumber;
  promptTokens: z.ZodNumber;
  completionTokens: z.ZodNumber;
  cost: z.ZodNumber;
  currency: z.ZodLiteral<'USD'>;
}> = z.object({
  totalTokens: z.number().int().nonnegative(),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  cost: z.number().nonnegative(),
  currency: z.literal('USD'),
});

export const apiRequestTrackingSchema: ReturnType<typeof z.object> = z.object({
  requestId: z.string(),
  model: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  status: z.enum(['pending', 'success', 'error'] as const),
  usage: apiUsageStatsSchema.optional(),
  error: apiErrorSchema.optional(),
});

export const apiConfigSchema: ReturnType<typeof z.object> = z.object({
  apiKey: z.string().min(1, 'API key cannot be empty'),
  apiKeyStorage: apiKeyStorageSchema,
  organizationId: z.string().optional(),
  defaultModel: aiModelSchema,
  timeoutMs: z.number().int().positive(),
  maxRetries: z.number().int().nonnegative(),
  costPerTokenMap: z.record(z.string(), z.number().nonnegative()),
});

export const batchTaggingJobSchema: ReturnType<typeof z.object> = z.object({
  id: z.string(),
  documents: z.array(z.string()),
  options: taggingOptionsSchema,
  status: z.enum(['pending', 'processing', 'completed', 'failed'] as const),
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
