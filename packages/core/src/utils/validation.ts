/**
 * Validation utilities for Obsidian Magic
 */
import { z } from 'zod';

import { CONVERSATION_TYPES, DOMAINS, LIFE_AREAS, SUBDOMAINS_MAP } from '../tagging/taxonomy';

import type { ConversationTypeTag } from '../models/ConversationTypeTag';
import type { DomainTag } from '../models/DomainTag';
import type { LifeAreaTag } from '../models/LifeAreaTag';
import type { SubdomainTag } from '../models/SubdomainTag';
import type { TagSet } from '../models/TagSet';
import type { YearTag } from '../models/YearTag';

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

// Safe cast of taxonomy domains to readonly arrays for Zod enum usage
const DOMAIN_ARRAY = [...DOMAINS] as [string, ...string[]];
const LIFE_AREA_ARRAY = [...LIFE_AREAS] as [string, ...string[]];
const CONVERSATION_TYPE_ARRAY = [...CONVERSATION_TYPES] as [string, ...string[]];

/**
 * Dictionary of subdomains by domain
 */
export const SUBDOMAINS: Record<DomainTag, readonly SubdomainTag[]> = (() => {
  const result: Partial<Record<DomainTag, readonly SubdomainTag[]>> = {};

  // Convert the subdomains map to the expected format
  for (const domain of DOMAINS) {
    const subdomains = SUBDOMAINS_MAP[domain];
    if (subdomains) {
      result[domain] = subdomains as readonly SubdomainTag[];
    }
  }

  return result as Record<DomainTag, readonly SubdomainTag[]>;
})();

/**
 * Zod schema for validating domain tags
 */
export const domainTagSchema = z.enum(DOMAIN_ARRAY);

/**
 * Zod schema for validating life area tags
 */
export const lifeAreaTagSchema = z.enum(LIFE_AREA_ARRAY);

/**
 * Zod schema for validating conversation type tags
 */
export const conversationTypeTagSchema = z.enum(CONVERSATION_TYPE_ARRAY);

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
  return DOMAINS.includes(value as DomainTag);
}

/**
 * Checks if a string is a valid life area
 * @param value - Value to check
 * @returns True if value is a valid life area
 */
export function isValidLifeArea(value: string): value is LifeAreaTag {
  return LIFE_AREAS.includes(value as LifeAreaTag);
}

/**
 * Checks if a string is a valid conversation type
 * @param value - Value to check
 * @returns True if value is a valid conversation type
 */
export function isValidConversationType(value: string): value is ConversationTypeTag {
  return CONVERSATION_TYPES.includes(value as ConversationTypeTag);
}
