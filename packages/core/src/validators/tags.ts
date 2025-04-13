/**
 * Zod validators for tag type definitions
 */

import { z } from 'zod';

// Basic tag validators
export const yearTagSchema = z.string().regex(/^\d{4}$/, 'Year must be a 4-digit number');

export const lifeAreaTagSchema = z.enum([
  'career',
  'relationships',
  'health',
  'learning',
  'projects',
  'personal-growth',
  'finance',
  'hobby'
]);

export const domainTagSchema = z.enum([
  'software-development',
  'philosophy',
  'design',
  'psychology',
  'business',
  'science',
  'arts',
  'entertainment',
  'technology',
  'health',
  'education',
  'finance'
]);

// This is a simplification as we can't directly map the complex SubdomainMap in Zod
// without excessive repetition, so we use a string with validation logic
export const subdomainTagSchema = z.string();

export const contextualTagSchema = z.string();

export const conversationTypeTagSchema = z.enum([
  'theory',
  'practical',
  'meta',
  'casual',
  'adhd-thought',
  'deep-dive',
  'exploration',
  'experimental',
  'reflection',
  'planning',
  'question',
  'analysis'
]);

export const confidenceScoreSchema = z.number()
  .min(0, 'Confidence score must be at least 0')
  .max(1, 'Confidence score must be at most 1');

// Complex tag validators
export const topicalTagSchema = z.object({
  domain: domainTagSchema,
  subdomain: subdomainTagSchema.optional(),
  contextual: contextualTagSchema.optional()
});

export const tagConfidenceSchema = z.object({
  overall: confidenceScoreSchema,
  year: confidenceScoreSchema.optional(),
  life_area: confidenceScoreSchema.optional(),
  domain: confidenceScoreSchema.optional(),
  subdomain: confidenceScoreSchema.optional(),
  contextual: confidenceScoreSchema.optional(),
  conversation_type: confidenceScoreSchema.optional()
});

export const tagSetSchema = z.object({
  year: yearTagSchema,
  life_area: lifeAreaTagSchema.optional(),
  topical_tags: z.array(topicalTagSchema),
  conversation_type: conversationTypeTagSchema,
  confidence: tagConfidenceSchema,
  explanations: z.record(z.string()).optional()
});

export const tagBehaviorSchema = z.enum(['append', 'replace', 'merge']);

// Type inference helpers
export type YearTagSchema = z.infer<typeof yearTagSchema>;
export type LifeAreaTagSchema = z.infer<typeof lifeAreaTagSchema>;
export type DomainTagSchema = z.infer<typeof domainTagSchema>;
export type SubdomainTagSchema = z.infer<typeof subdomainTagSchema>;
export type ContextualTagSchema = z.infer<typeof contextualTagSchema>;
export type ConversationTypeTagSchema = z.infer<typeof conversationTypeTagSchema>;
export type ConfidenceScoreSchema = z.infer<typeof confidenceScoreSchema>;
export type TopicalTagSchema = z.infer<typeof topicalTagSchema>;
export type TagConfidenceSchema = z.infer<typeof tagConfidenceSchema>;
export type TagSetSchema = z.infer<typeof tagSetSchema>;
export type TagBehaviorSchema = z.infer<typeof tagBehaviorSchema>; 