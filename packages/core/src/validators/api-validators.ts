/**
 * Zod validators for API type definitions
 */

import { z } from 'zod';

import { tagSetSchema } from './tags-validators';

// Basic API validators
export const aiModelSchema: z.ZodString = z.string();

export const apiKeyStorageSchema: z.ZodEnum<['local', 'system']> = z.enum(['local', 'system']);

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

export const taggingOptionsSchema: z.ZodObject<{
  model: z.ZodString;
  behavior: z.ZodEnum<['append', 'replace', 'merge']>;
  minConfidence: z.ZodNumber;
  reviewThreshold: z.ZodNumber;
  generateExplanations: z.ZodBoolean;
  taxonomy: z.ZodOptional<typeof tagSetSchema>;
}> = z.object({
  model: aiModelSchema,
  behavior: z.enum(['append', 'replace', 'merge']),
  minConfidence: z.number().min(0).max(1),
  reviewThreshold: z.number().min(0).max(1),
  generateExplanations: z.boolean(),
  taxonomy: tagSetSchema.optional(),
});

export const documentSchema: z.ZodObject<{
  id: z.ZodString;
  path: z.ZodString;
  content: z.ZodString;
  metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  existingTags: z.ZodOptional<typeof tagSetSchema>;
}> = z.object({
  id: z.string(),
  path: z.string(),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
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

export const apiRequestTrackingSchema: z.ZodObject<{
  requestId: z.ZodString;
  model: z.ZodString;
  startTime: z.ZodDate;
  endTime: z.ZodOptional<z.ZodDate>;
  status: z.ZodEnum<['pending', 'success', 'error']>;
  usage: z.ZodOptional<typeof apiUsageStatsSchema>;
  error: z.ZodOptional<typeof apiErrorSchema>;
}> = z.object({
  requestId: z.string(),
  model: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  status: z.enum(['pending', 'success', 'error']),
  usage: apiUsageStatsSchema.optional(),
  error: apiErrorSchema.optional(),
});

export const apiConfigSchema: z.ZodObject<{
  apiKey: z.ZodString;
  apiKeyStorage: z.ZodEnum<['local', 'system']>;
  organizationId: z.ZodOptional<z.ZodString>;
  defaultModel: z.ZodString;
  timeoutMs: z.ZodNumber;
  maxRetries: z.ZodNumber;
  costPerTokenMap: z.ZodRecord<z.ZodString, z.ZodNumber>;
}> = z.object({
  apiKey: z.string().min(1, 'API key cannot be empty'),
  apiKeyStorage: apiKeyStorageSchema,
  organizationId: z.string().optional(),
  defaultModel: aiModelSchema,
  timeoutMs: z.number().int().positive(),
  maxRetries: z.number().int().nonnegative(),
  costPerTokenMap: z.record(z.number().nonnegative()),
});

export const batchTaggingJobSchema: z.ZodObject<{
  id: z.ZodString;
  documents: z.ZodArray<z.ZodString>;
  options: typeof taggingOptionsSchema;
  status: z.ZodEnum<['pending', 'processing', 'completed', 'failed']>;
  progress: z.ZodObject<{
    total: z.ZodNumber;
    completed: z.ZodNumber;
    failed: z.ZodNumber;
  }>;
  stats: z.ZodOptional<
    z.ZodObject<{
      startTime: z.ZodDate;
      endTime: z.ZodOptional<z.ZodDate>;
      totalTokens: z.ZodNumber;
      totalCost: z.ZodNumber;
      currency: z.ZodLiteral<'USD'>;
    }>
  >;
}> = z.object({
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
