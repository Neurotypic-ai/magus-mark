/**
 * Validation utility functions for Obsidian Magic
 */
import { DEFAULT_TAXONOMY } from '@obsidian-magic/core';
import { z } from 'zod';

import type { ConversationTypeTag, DomainTag, LifeAreaTag, SubdomainTag, TagSet, YearTag } from '@obsidian-magic/types';

/**
 * Validates and ensures a value is between min and max (inclusive)
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Zod schema for validating confidence scores (0.0 to 1.0)
 */
export const confidenceScoreSchema = z
  .number()
  .min(0)
  .max(1)
  .refine((n) => !isNaN(n), {
    message: 'Confidence score must be a valid number',
  });

/**
 * Zod schema for validating year tags (4-digit years)
 */
export const yearTagSchema = z
  .string()
  .regex(/^\d{4}$/, {
    message: 'Year must be a 4-digit number',
  })
  .transform((val) => val as YearTag);

/**
 * Dictionary of domains
 */
export const DOMAINS = DEFAULT_TAXONOMY.domains as readonly DomainTag[];

/**
 * Dictionary of life areas
 */
export const LIFE_AREAS = DEFAULT_TAXONOMY.lifeAreas as readonly LifeAreaTag[];

/**
 * Dictionary of conversation types
 */
export const CONVERSATION_TYPES = DEFAULT_TAXONOMY.conversationTypes as readonly ConversationTypeTag[];

/**
 * Dictionary of subdomains by domain
 */
export const SUBDOMAINS: Record<DomainTag, readonly SubdomainTag[]> = (() => {
  const result: Partial<Record<DomainTag, readonly SubdomainTag[]>> = {};

  // Convert the subdomains map from DEFAULT_TAXONOMY to the expected format
  for (const domain of DEFAULT_TAXONOMY.domains) {
    // TypeScript isn't smart enough to know these are valid keys
    const subdomains = DEFAULT_TAXONOMY.subdomains[domain as keyof typeof DEFAULT_TAXONOMY.subdomains];
    if (subdomains) {
      result[domain as DomainTag] = subdomains as readonly SubdomainTag[];
    }
  }

  return result as Record<DomainTag, readonly SubdomainTag[]>;
})();

/**
 * Zod schema for validating domain tags
 */
export const domainTagSchema = z.enum(DOMAINS as any);

/**
 * Zod schema for validating life area tags
 */
export const lifeAreaTagSchema = z.enum(LIFE_AREAS as any);

/**
 * Zod schema for validating conversation type tags
 */
export const conversationTypeTagSchema = z.enum(CONVERSATION_TYPES as any);

/**
 * Zod schema for validating contextual tags
 */
export const contextualTagSchema = z.string();

/**
 * Simple version of topical tag schema for validation
 */
export const topicalTagSchema = z.object({
  domain: domainTagSchema,
  subdomain: z.string().optional(),
  contextual: z.string().optional(),
});

/**
 * Simple version of tag confidence schema for validation
 */
export const tagConfidenceSchema = z.object({
  overall: confidenceScoreSchema,
  year: confidenceScoreSchema.optional(),
  life_area: confidenceScoreSchema.optional(),
  domain: confidenceScoreSchema.optional(),
  subdomain: confidenceScoreSchema.optional(),
  contextual: confidenceScoreSchema.optional(),
  conversation_type: confidenceScoreSchema.optional(),
});

/**
 * Simple version of tag set schema for validation
 */
export const tagSetSchema = z.object({
  year: yearTagSchema,
  life_area: lifeAreaTagSchema.optional(),
  topical_tags: z.array(topicalTagSchema).min(1),
  conversation_type: conversationTypeTagSchema,
  confidence: tagConfidenceSchema,
  explanations: z.record(z.string()).optional(),
});

/**
 * Type-safe validation that checks if a domain has a specific subdomain
 * @param domain - Domain to check
 * @param subdomain - Subdomain to check
 * @returns True if the domain has the subdomain
 */
export function isDomainWithSubdomain(domain: DomainTag, subdomain: string): boolean {
  return SUBDOMAINS[domain]?.includes(subdomain) ?? false;
}

/**
 * Validates a tag set and returns it if valid, or throws an error
 * @param tagSet - Tag set to validate
 * @returns Validated tag set
 */
export function validateTagSet(tagSet: unknown): TagSet {
  return tagSetSchema.parse(tagSet) as TagSet;
}

/**
 * Gets all valid subdomains for a given domain
 * @param domain - Domain to get subdomains for
 * @returns Array of subdomains
 */
export function getSubdomainsForDomain(domain: DomainTag): readonly SubdomainTag[] {
  return SUBDOMAINS[domain] ?? [];
}

/**
 * Checks if a string is a valid domain
 * @param value - Value to check
 * @returns True if value is a valid domain
 */
export function isValidDomain(value: string): value is DomainTag {
  return (DOMAINS as readonly string[]).includes(value);
}

/**
 * Checks if a string is a valid life area
 * @param value - Value to check
 * @returns True if value is a valid life area
 */
export function isValidLifeArea(value: string): value is LifeAreaTag {
  return (LIFE_AREAS as readonly string[]).includes(value);
}

/**
 * Checks if a string is a valid conversation type
 * @param value - Value to check
 * @returns True if value is a valid conversation type
 */
export function isValidConversationType(value: string): value is ConversationTypeTag {
  return (CONVERSATION_TYPES as readonly string[]).includes(value);
}
