/**
 * Zod validators for tag type definitions
 */

import { z } from 'zod';

import { CONVERSATION_TYPES, DOMAINS, LIFE_AREAS, SUBDOMAINS_MAP } from '../tagging/taxonomy';

import type { ConversationTypeTag } from '../models/ConversationTypeTag';
import type { DomainTag } from '../models/DomainTag';
import type { LifeAreaTag } from '../models/LifeAreaTag';
import type { SubdomainTag } from '../models/SubdomainTag';
import type { TagSet } from '../models/TagSet';

// Basic tag validators
export const yearTagSchema: z.ZodString = z.string().regex(/^\d{4}$/, 'Year must be a 4-digit number');

export const lifeAreaTagSchema: z.ZodEnum<[string, string, string, string, string, string, string, string]> = z.enum([
  'career',
  'relationships',
  'health',
  'learning',
  'projects',
  'personal-growth',
  'finance',
  'hobby',
]);

export const domainTagSchema: z.ZodEnum<
  [string, string, string, string, string, string, string, string, string, string, string, string]
> = z.enum([
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
  'finance',
]);

// This is a simplification as we can't directly map the complex SubdomainMap in Zod
// without excessive repetition, so we use a string with validation logic
export const subdomainTagSchema: z.ZodString = z.string();

export const contextualTagSchema: z.ZodString = z.string();

export const conversationTypeTagSchema: z.ZodEnum<
  [string, string, string, string, string, string, string, string, string, string, string, string]
> = z.enum([
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
  'analysis',
]);

export const confidenceScoreSchema: z.ZodNumber = z
  .number()
  .min(0, 'Confidence score must be at least 0')
  .max(1, 'Confidence score must be at most 1');

// Complex tag validators
export const topicalTagSchema: z.ZodObject<{
  domain: typeof domainTagSchema;
  subdomain: z.ZodOptional<typeof subdomainTagSchema>;
  contextual: z.ZodOptional<typeof contextualTagSchema>;
}> = z.object({
  domain: domainTagSchema,
  subdomain: subdomainTagSchema.optional(),
  contextual: contextualTagSchema.optional(),
});

export const tagConfidenceSchema: z.ZodObject<{
  overall: z.ZodNumber;
  year: z.ZodOptional<z.ZodNumber>;
  life_area: z.ZodOptional<z.ZodNumber>;
  domain: z.ZodOptional<z.ZodNumber>;
  subdomain: z.ZodOptional<z.ZodNumber>;
  contextual: z.ZodOptional<z.ZodNumber>;
  conversation_type: z.ZodOptional<z.ZodNumber>;
}> = z.object({
  overall: confidenceScoreSchema,
  year: confidenceScoreSchema.optional(),
  life_area: confidenceScoreSchema.optional(),
  domain: confidenceScoreSchema.optional(),
  subdomain: confidenceScoreSchema.optional(),
  contextual: confidenceScoreSchema.optional(),
  conversation_type: confidenceScoreSchema.optional(),
});

export const tagSetSchema: z.ZodObject<{
  year: typeof yearTagSchema;
  life_area: z.ZodOptional<typeof lifeAreaTagSchema>;
  topical_tags: z.ZodArray<
    z.ZodObject<{
      domain: typeof domainTagSchema;
      subdomain: z.ZodOptional<typeof subdomainTagSchema>;
      contextual: z.ZodOptional<typeof contextualTagSchema>;
    }>
  >;
  conversation_type: typeof conversationTypeTagSchema;
  confidence: typeof tagConfidenceSchema;
}> = z.object({
  year: yearTagSchema,
  life_area: lifeAreaTagSchema.optional(),
  topical_tags: z.array(topicalTagSchema),
  conversation_type: conversationTypeTagSchema,
  confidence: tagConfidenceSchema,
});

export const tagBehaviorSchema: z.ZodEnum<['append', 'replace', 'merge']> = z.enum(['append', 'replace', 'merge']);

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

/**
 * Validates and ensures a value is between min and max (inclusive)
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Dictionary of subdomains by domain
 */
export const SUBDOMAINS: Record<DomainTag, readonly SubdomainTag[]> = (() => {
  const result: Partial<Record<DomainTag, readonly SubdomainTag[]>> = {};
  for (const domain of DOMAINS) {
    const subs = SUBDOMAINS_MAP[domain];
    if (subs) result[domain] = subs as readonly SubdomainTag[];
  }
  return result as Record<DomainTag, readonly SubdomainTag[]>;
})();

/** Checks if a domain has a specific subdomain */
export function isDomainWithSubdomain(domain: DomainTag, subdomain: string): boolean {
  const subs = SUBDOMAINS_MAP[domain as keyof typeof SUBDOMAINS_MAP];
  return subs?.includes(subdomain) ?? false;
}

/** Validates a tag set and returns it if valid, or throws */
export function validateTagSet(tagSet: unknown): TagSet {
  return tagSetSchema.parse(tagSet) as TagSet;
}

/** Gets all valid subdomains for a given domain */
export function getSubdomainsForDomain(domain: DomainTag): readonly SubdomainTag[] {
  return SUBDOMAINS[domain] ?? [];
}

/** Checks if a string is a valid domain */
export function isValidDomain(value: string): value is DomainTag {
  return DOMAINS.includes(value as DomainTag);
}

/** Checks if a string is a valid life area */
export function isValidLifeArea(value: string): value is LifeAreaTag {
  return LIFE_AREAS.includes(value as LifeAreaTag);
}

/** Checks if a string is a valid conversation type */
export function isValidConversationType(value: string): value is ConversationTypeTag {
  return CONVERSATION_TYPES.includes(value as ConversationTypeTag);
}
