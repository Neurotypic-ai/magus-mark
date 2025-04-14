/**
 * Core tag definitions for Obsidian Magic's tagging system
 */
import type { CONTEXTUAL_TAGS, CONVERSATION_TYPE_TAGS, DOMAIN_TAGS, LIFE_AREA_TAGS, SUBDOMAIN_TAGS } from './taxonomy';

/**
 * Represents a year tag (strictly 4-digit years)
 */
export type YearTag = `${number}`;

/**
 * Life area tags taxonomy
 */
export type LifeAreaTag = (typeof LIFE_AREA_TAGS)[number];

/**
 * Primary knowledge domains (predefined)
 */
export type PredefinedDomainTag = (typeof DOMAIN_TAGS)[number];

/**
 * Domain tag type that allows both predefined values and custom extensions
 */
export type DomainTag = PredefinedDomainTag | (string & {});

/**
 * Generate the subdomain types for each domain
 */
type SubdomainTypes = {
  [K in keyof typeof SUBDOMAIN_TAGS]: (typeof SUBDOMAIN_TAGS)[K][number] | string[] | readonly string[];
};

/**
 * Subdomains by primary domain
 */
export interface SubdomainMap extends SubdomainTypes, Record<string, string | string[] | readonly string[]> {
  // Allow for extension with new domains
}

/**
 * Subdomain type
 */
export type SubdomainTag = string;

/**
 * Common predefined contextual wildcard tags
 */
export type PredefinedContextualTag = (typeof CONTEXTUAL_TAGS)[number];

/**
 * Contextual tag type that allows both predefined values and custom extensions
 */
export type ContextualTag = PredefinedContextualTag | (string & {});

/**
 * Conversation type tags taxonomy
 */
export type ConversationTypeTag = (typeof CONVERSATION_TYPE_TAGS)[number];

/**
 * Confidence score for a tag assignment (0.0 to 1.0)
 */
export type ConfidenceScore = number;

/**
 * Topical tag structure combining domain, subdomain, and contextual elements
 */
export interface TopicalTag {
  domain: DomainTag;
  subdomain?: SubdomainTag | undefined;
  contextual?: ContextualTag | undefined;
}

/**
 * Confidence scores for each tag category
 */
export interface TagConfidence {
  overall: ConfidenceScore;
  year?: ConfidenceScore;
  life_area?: ConfidenceScore;
  domain?: ConfidenceScore;
  subdomain?: ConfidenceScore;
  contextual?: ConfidenceScore;
  conversation_type?: ConfidenceScore;
}

/**
 * Complete tag set for a conversation
 */
export interface TagSet {
  year: YearTag;
  life_area?: LifeAreaTag | undefined;
  topical_tags: TopicalTag[];
  conversation_type: ConversationTypeTag;
  confidence: TagConfidence;
  explanations?: Record<string, string> | undefined;
}

/**
 * Tag application behavior options
 */
export type TagBehavior = 'append' | 'replace' | 'merge' | 'suggest';
