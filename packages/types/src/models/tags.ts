/**
 * Core tag definitions for Obsidian Magic's tagging system
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
  | 'finance'
  | 'productivity'
  | 'writing'
  | 'ai'
  | string; // Allow for domain extensibility

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
    | 'architecture'
    | 'desktop'
    | 'web'
    | 'api'
    | 'database'
    | 'performance'
    | 'testing'
    | 'debugging'
    | 'game-dev';
  'philosophy': 
    | 'ethics' 
    | 'metaphysics' 
    | 'epistemology' 
    | 'logic' 
    | 'aesthetics'
    | 'existentialism'
    | 'phenomenology'
    | 'political-philosophy'
    | 'philosophy-of-mind'
    | 'philosophy-of-science';
  'design': 
    | 'ux' 
    | 'ui' 
    | 'graphic' 
    | 'industrial' 
    | 'interaction'
    | 'graphic-design'
    | 'typography'
    | 'visual-design'
    | 'animation'
    | 'illustration'
    | 'branding'
    | 'information-architecture'
    | 'product-design';
  'psychology': 
    | 'cognitive' 
    | 'clinical' 
    | 'developmental' 
    | 'social' 
    | 'behavioral'
    | 'positive-psychology'
    | 'neuroscience'
    | 'personality'
    | 'motivation'
    | 'emotion';
  'business': 
    | 'marketing' 
    | 'strategy' 
    | 'management' 
    | 'entrepreneurship' 
    | 'operations'
    | 'finance'
    | 'sales'
    | 'product-management'
    | 'leadership';
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
    | 'teaching'
    | 'pedagogy'
    | 'learning-theory'
    | 'curriculum'
    | 'e-learning'
    | 'educational-technology'
    | 'literacy'
    | 'higher-education'
    | 'lifelong-learning';
  'finance': 
    | 'investing' 
    | 'personal-finance' 
    | 'corporate-finance' 
    | 'crypto' 
    | 'banking';
  'productivity':
    | 'time-management'
    | 'task-management'
    | 'note-taking'
    | 'knowledge-management'
    | 'systems'
    | 'workflow'
    | 'organization'
    | 'habits'
    | 'focus'
    | 'tools';
  'writing':
    | 'fiction'
    | 'non-fiction'
    | 'technical-writing'
    | 'blogging'
    | 'copywriting'
    | 'storytelling'
    | 'editing'
    | 'publishing'
    | 'journalism'
    | 'creative-writing'
    | 'documentation';
  'ai':
    | 'machine-learning'
    | 'deep-learning'
    | 'nlp'
    | 'computer-vision'
    | 'reinforcement-learning'
    | 'prompt-engineering'
    | 'data-science'
    | 'neural-networks'
    | 'generative-ai'
    | 'llms';
  [key: string]: string | string[]; // Allow for extension with new domains
}

/**
 * Subdomain type 
 */
export type SubdomainTag = string;

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
export type TagBehavior = 'append' | 'replace' | 'merge'; 