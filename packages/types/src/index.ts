/**
 * Core type definitions for Obsidian Magic
 */

/**
 * Represents a year tag (strictly 4-digit years)
 */
export type YearTag = `${number}`;

/**
 * Life area tags taxonomy
 */
export type LifeAreaTag = 
  | 'career'
  | 'relationships'
  | 'health'
  | 'learning'
  | 'projects'
  | 'personal-growth'
  | 'finance'
  | 'hobby';

/**
 * Primary knowledge domains
 */
export type DomainTag =
  | 'software-development'
  | 'philosophy'
  | 'design'
  | 'psychology'
  | 'business'
  | 'science'
  | 'arts'
  | 'entertainment'
  | 'technology'
  | 'health'
  | 'education'
  | 'finance';

/**
 * Subdomains by primary domain
 */
export interface SubdomainMap {
  'software-development': 
    | 'frontend' 
    | 'backend' 
    | 'devops' 
    | 'mobile' 
    | 'data' 
    | 'security' 
    | 'architecture';
  'philosophy': 
    | 'ethics' 
    | 'metaphysics' 
    | 'epistemology' 
    | 'logic' 
    | 'aesthetics';
  'design': 
    | 'ux' 
    | 'ui' 
    | 'graphic' 
    | 'industrial' 
    | 'interaction';
  'psychology': 
    | 'cognitive' 
    | 'clinical' 
    | 'developmental' 
    | 'social' 
    | 'behavioral';
  'business': 
    | 'marketing' 
    | 'strategy' 
    | 'management' 
    | 'entrepreneurship' 
    | 'operations';
  'science': 
    | 'physics' 
    | 'biology' 
    | 'chemistry' 
    | 'mathematics' 
    | 'computer-science';
  'arts': 
    | 'visual' 
    | 'music' 
    | 'literature' 
    | 'performing' 
    | 'digital';
  'entertainment': 
    | 'games' 
    | 'film' 
    | 'television' 
    | 'books' 
    | 'sports';
  'technology': 
    | 'ai' 
    | 'blockchain' 
    | 'iot' 
    | 'vr-ar' 
    | 'robotics';
  'health': 
    | 'fitness' 
    | 'nutrition' 
    | 'mental-health' 
    | 'medical' 
    | 'wellness';
  'education': 
    | 'k12' 
    | 'higher-ed' 
    | 'professional' 
    | 'self-learning' 
    | 'teaching';
  'finance': 
    | 'investing' 
    | 'personal-finance' 
    | 'corporate-finance' 
    | 'crypto' 
    | 'banking';
}

/**
 * Subdomain type extracted from the SubdomainMap
 */
export type SubdomainTag = SubdomainMap[DomainTag];

/**
 * Common contextual wildcard tags that can be used across domains
 */
export type ContextualTag = 
  | 'beginner'
  | 'advanced'
  | 'comparison'
  | 'tutorial'
  | 'critique'
  | 'review'
  | 'history'
  | 'future'
  | 'trends'
  | 'innovation'
  | 'ethics'
  | 'impact'
  | 'tools'
  | 'techniques'
  | 'resources'
  | 'case-study'
  | 'problem-solving'
  | 'decision-making'
  | 'productivity'
  | 'communication'
  | string; // Allow for custom contextual tags

/**
 * Conversation type tags taxonomy
 */
export type ConversationTypeTag =
  | 'theory'
  | 'practical'
  | 'meta'
  | 'casual'
  | 'adhd-thought'
  | 'deep-dive'
  | 'exploration'
  | 'experimental'
  | 'reflection'
  | 'planning'
  | 'question'
  | 'analysis';

/**
 * Confidence score for a tag assignment (0.0 to 1.0)
 */
export type ConfidenceScore = number;

/**
 * Topical tag structure combining domain, subdomain, and contextual elements
 */
export interface TopicalTag {
  domain: DomainTag;
  subdomain?: SubdomainTag;
  contextual?: ContextualTag;
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
  life_area?: LifeAreaTag;
  topical_tags: TopicalTag[];
  conversation_type: ConversationTypeTag;
  confidence: TagConfidence;
  explanations?: Record<string, string>;
}

/**
 * Tag application behavior options
 */
export type TagBehavior = 'append' | 'replace' | 'merge';

/**
 * OpenAI model options
 */
export type AIModel = 'gpt-4o' | 'gpt-3.5-turbo';

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
  minConfidence: ConfidenceScore;
  reviewThreshold: ConfidenceScore;
  generateExplanations: boolean;
}

/**
 * Document representing a conversation to be tagged
 */
export interface Document {
  id: string;
  path: string;
  content: string;
  metadata?: Record<string, unknown>;
  existingTags?: TagSet;
}
