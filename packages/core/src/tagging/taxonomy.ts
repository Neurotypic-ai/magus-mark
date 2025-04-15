/**
 * Export directly usable typed arrays for validation
 */
import type { ContextualTag } from '../models/ContextualTag';
import type { ConversationTypeTag } from '../models/ConversationTypeTag';
import type { DomainTag } from '../models/DomainTag';
import type { LifeAreaTag } from '../models/LifeAreaTag';
import type { SubdomainMap } from '../models/SubdomainMap';
import type { Taxonomy } from '../models/Taxonomy';

/**
 * Domain tags
 */
export const DOMAIN_TAGS = [
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
  'productivity',
  'writing',
  'ai',
] as const;

/**
 * Subdomain tags organized by domain
 */
export const SUBDOMAIN_TAGS = {
  'software-development': [
    'frontend',
    'backend',
    'devops',
    'mobile',
    'data',
    'security',
    'architecture',
    'desktop',
    'web',
    'api',
    'database',
    'performance',
    'testing',
    'debugging',
    'game-dev',
  ],
  philosophy: [
    'ethics',
    'metaphysics',
    'epistemology',
    'logic',
    'aesthetics',
    'existentialism',
    'phenomenology',
    'political-philosophy',
    'philosophy-of-mind',
    'philosophy-of-science',
  ],
  design: [
    'ux',
    'ui',
    'graphic',
    'industrial',
    'interaction',
    'graphic-design',
    'typography',
    'visual-design',
    'animation',
    'illustration',
    'branding',
    'information-architecture',
    'product-design',
  ],
  psychology: [
    'cognitive',
    'clinical',
    'developmental',
    'social',
    'behavioral',
    'positive-psychology',
    'neuroscience',
    'personality',
    'motivation',
    'emotion',
  ],
  business: [
    'marketing',
    'strategy',
    'management',
    'entrepreneurship',
    'operations',
    'finance',
    'sales',
    'product-management',
    'leadership',
  ],
  science: ['physics', 'biology', 'chemistry', 'mathematics', 'computer-science'],
  arts: ['visual', 'music', 'literature', 'performing', 'digital'],
  entertainment: ['games', 'film', 'television', 'books', 'sports'],
  technology: ['ai', 'blockchain', 'iot', 'vr-ar', 'robotics'],
  health: ['fitness', 'nutrition', 'mental-health', 'medical', 'wellness'],
  education: [
    'k12',
    'higher-ed',
    'professional',
    'self-learning',
    'teaching',
    'pedagogy',
    'learning-theory',
    'curriculum',
    'e-learning',
    'educational-technology',
    'literacy',
    'higher-education',
    'lifelong-learning',
  ],
  finance: ['investing', 'personal-finance', 'corporate-finance', 'crypto', 'banking'],
  productivity: [
    'time-management',
    'task-management',
    'note-taking',
    'knowledge-management',
    'systems',
    'workflow',
    'organization',
    'habits',
    'focus',
    'tools',
  ],
  writing: [
    'fiction',
    'non-fiction',
    'technical-writing',
    'blogging',
    'copywriting',
    'storytelling',
    'editing',
    'publishing',
    'journalism',
    'creative-writing',
    'documentation',
  ],
  ai: [
    'machine-learning',
    'deep-learning',
    'nlp',
    'computer-vision',
    'reinforcement-learning',
    'prompt-engineering',
    'data-science',
    'neural-networks',
    'generative-ai',
    'llms',
  ],
} as const;

/**
 * Life area tags
 */
export const LIFE_AREA_TAGS = [
  'career',
  'relationships',
  'health',
  'learning',
  'projects',
  'personal-growth',
  'finance',
  'hobby',
] as const;

/**
 * Conversation type tags
 */
export const CONVERSATION_TYPE_TAGS = [
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
  'note',
  'summary',
] as const;

/**
 * Contextual tags
 */
export const CONTEXTUAL_TAGS = [
  'beginner',
  'advanced',
  'comparison',
  'tutorial',
  'critique',
  'review',
  'history',
  'future',
  'trends',
  'innovation',
  'ethics',
  'impact',
  'tools',
  'techniques',
  'resources',
  'case-study',
  'problem-solving',
  'decision-making',
  'productivity',
  'communication',
] as const;

/**
 * Export ready-to-use typed arrays for external modules
 */
export const DOMAINS = DOMAIN_TAGS as readonly DomainTag[];
export const LIFE_AREAS = LIFE_AREA_TAGS as readonly LifeAreaTag[];
export const CONVERSATION_TYPES = CONVERSATION_TYPE_TAGS as readonly ConversationTypeTag[];
export const CONTEXTUAL_TAGS_LIST = CONTEXTUAL_TAGS as readonly ContextualTag[];
export const SUBDOMAINS_MAP = SUBDOMAIN_TAGS as unknown as SubdomainMap;

/**
 * Default taxonomy for the tagging system
 */
export const DEFAULT_TAXONOMY: Taxonomy = {
  domains: [...DOMAINS],
  subdomains: { ...SUBDOMAINS_MAP },
  lifeAreas: [...LIFE_AREAS],
  conversationTypes: [...CONVERSATION_TYPES],
  contextualTags: [...CONTEXTUAL_TAGS_LIST],
};
