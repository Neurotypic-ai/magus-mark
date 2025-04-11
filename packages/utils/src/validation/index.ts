/**
 * Validation utility functions for Obsidian Magic
 */
import { z } from 'zod';
import type { 
  DomainTag, 
  SubdomainMap, 
  SubdomainTag, 
  LifeAreaTag, 
  ConversationTypeTag,
  TagSet,
  TopicalTag,
  TagConfidence,
  YearTag,
  ConfidenceScore
} from '@obsidian-magic/types';

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
export const confidenceScoreSchema = z.number()
  .min(0)
  .max(1)
  .refine(n => !isNaN(n), {
    message: "Confidence score must be a valid number"
  });

/**
 * Zod schema for validating year tags (4-digit years)
 */
export const yearTagSchema = z.string()
  .regex(/^\d{4}$/, {
    message: "Year must be a 4-digit number"
  })
  .transform(val => val as YearTag);

/**
 * Dictionary of domains
 */
export const DOMAINS = [
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
] as const;

/**
 * Dictionary of life areas
 */
export const LIFE_AREAS = [
  'career',
  'relationships',
  'health',
  'learning',
  'projects',
  'personal-growth',
  'finance',
  'hobby'
] as const;

/**
 * Dictionary of conversation types
 */
export const CONVERSATION_TYPES = [
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
] as const;

/**
 * Dictionary of subdomains by domain
 */
export const SUBDOMAINS: Record<DomainTag, readonly SubdomainTag[]> = {
  'software-development': ['frontend', 'backend', 'devops', 'mobile', 'data', 'security', 'architecture'] as const,
  'philosophy': ['ethics', 'metaphysics', 'epistemology', 'logic', 'aesthetics'] as const,
  'design': ['ux', 'ui', 'graphic', 'industrial', 'interaction'] as const,
  'psychology': ['cognitive', 'clinical', 'developmental', 'social', 'behavioral'] as const,
  'business': ['marketing', 'strategy', 'management', 'entrepreneurship', 'operations'] as const,
  'science': ['physics', 'biology', 'chemistry', 'mathematics', 'computer-science'] as const,
  'arts': ['visual', 'music', 'literature', 'performing', 'digital'] as const,
  'entertainment': ['games', 'film', 'television', 'books', 'sports'] as const,
  'technology': ['ai', 'blockchain', 'iot', 'vr-ar', 'robotics'] as const,
  'health': ['fitness', 'nutrition', 'mental-health', 'medical', 'wellness'] as const,
  'education': ['k12', 'higher-ed', 'professional', 'self-learning', 'teaching'] as const,
  'finance': ['investing', 'personal-finance', 'corporate-finance', 'crypto', 'banking'] as const
};

/**
 * Zod schema for validating domain tags
 */
export const domainTagSchema = z.enum(DOMAINS);

/**
 * Zod schema for validating life area tags
 */
export const lifeAreaTagSchema = z.enum(LIFE_AREAS);

/**
 * Zod schema for validating conversation type tags
 */
export const conversationTypeTagSchema = z.enum(CONVERSATION_TYPES);

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
  contextual: z.string().optional()
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
  conversation_type: confidenceScoreSchema.optional()
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
  explanations: z.record(z.string()).optional()
});

/**
 * Type-safe validation that checks if a domain has a specific subdomain
 * @param domain - Domain to check
 * @param subdomain - Subdomain to check
 * @returns True if the domain has the subdomain
 */
export function isDomainWithSubdomain(
  domain: DomainTag,
  subdomain: string
): subdomain is SubdomainMap[typeof domain] {
  return SUBDOMAINS[domain].includes(subdomain as any);
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
  return SUBDOMAINS[domain];
}

/**
 * Checks if a string is a valid domain
 * @param value - Value to check
 * @returns True if value is a valid domain
 */
export function isValidDomain(value: string): value is DomainTag {
  return DOMAINS.includes(value as any);
}

/**
 * Checks if a string is a valid life area
 * @param value - Value to check
 * @returns True if value is a valid life area
 */
export function isValidLifeArea(value: string): value is LifeAreaTag {
  return LIFE_AREAS.includes(value as any);
}

/**
 * Checks if a string is a valid conversation type
 * @param value - Value to check
 * @returns True if value is a valid conversation type
 */
export function isValidConversationType(value: string): value is ConversationTypeTag {
  return CONVERSATION_TYPES.includes(value as any);
} 