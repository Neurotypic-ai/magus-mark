/**
 * Taxonomy management for the tagging system
 */
import type { 
  DomainTag, 
  SubdomainMap, 
  LifeAreaTag, 
  ConversationTypeTag,
  ContextualTag
} from '@obsidian-magic/types';

/**
 * Complete taxonomy for the tagging system
 */
export interface Taxonomy {
  domains: DomainTag[];
  subdomains: SubdomainMap;
  lifeAreas: LifeAreaTag[];
  conversationTypes: ConversationTypeTag[];
  contextualTags: ContextualTag[];
}

/**
 * Default taxonomy for the tagging system
 */
export const DEFAULT_TAXONOMY: Taxonomy = {
  domains: [
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
    'ai'
  ],
  
  subdomains: {
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
      'game-dev'
    ],
    'philosophy': [
      'ethics', 
      'metaphysics', 
      'epistemology', 
      'logic', 
      'aesthetics',
      'existentialism',
      'phenomenology',
      'political-philosophy',
      'philosophy-of-mind',
      'philosophy-of-science'
    ],
    'design': [
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
      'product-design'
    ],
    'psychology': [
      'cognitive', 
      'clinical', 
      'developmental', 
      'social', 
      'behavioral',
      'positive-psychology',
      'neuroscience',
      'personality',
      'motivation',
      'emotion'
    ],
    'business': [
      'marketing', 
      'strategy', 
      'management', 
      'entrepreneurship', 
      'operations',
      'finance',
      'sales',
      'product-management',
      'leadership'
    ],
    'science': [
      'physics', 
      'biology', 
      'chemistry', 
      'mathematics', 
      'computer-science'
    ],
    'arts': [
      'visual', 
      'music', 
      'literature', 
      'performing', 
      'digital'
    ],
    'entertainment': [
      'games', 
      'film', 
      'television', 
      'books', 
      'sports'
    ],
    'technology': [
      'ai', 
      'blockchain', 
      'iot', 
      'vr-ar', 
      'robotics'
    ],
    'health': [
      'fitness', 
      'nutrition', 
      'mental-health', 
      'medical', 
      'wellness'
    ],
    'education': [
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
      'lifelong-learning'
    ],
    'finance': [
      'investing', 
      'personal-finance', 
      'corporate-finance', 
      'crypto', 
      'banking'
    ],
    'productivity': [
      'time-management',
      'task-management',
      'note-taking',
      'knowledge-management',
      'systems',
      'workflow',
      'organization',
      'habits',
      'focus',
      'tools'
    ],
    'writing': [
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
      'documentation'
    ],
    'ai': [
      'machine-learning',
      'deep-learning',
      'nlp',
      'computer-vision',
      'reinforcement-learning',
      'prompt-engineering',
      'data-science',
      'neural-networks',
      'generative-ai',
      'llms'
    ]
  },
  
  lifeAreas: [
    'career',
    'relationships',
    'health',
    'learning',
    'projects',
    'personal-growth',
    'finance',
    'hobby'
  ],
  
  conversationTypes: [
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
  ],
  
  contextualTags: [
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
    'communication'
  ]
};

/**
 * TaxonomyManager provides methods for working with the tagging taxonomy
 */
export class TaxonomyManager {
  private taxonomy: Taxonomy;
  private customDomains = new Set<string>();
  private customSubdomains = new Map<string, Set<string>>();
  private customContextualTags = new Set<string>();
  
  constructor(customTaxonomy?: Partial<Taxonomy>) {
    this.taxonomy = { ...DEFAULT_TAXONOMY };
    
    // Apply custom taxonomy if provided
    if (customTaxonomy) {
      if (customTaxonomy.domains) {
        this.taxonomy.domains = [...this.taxonomy.domains, ...customTaxonomy.domains.filter(d => !this.taxonomy.domains.includes(d))];
        customTaxonomy.domains.forEach(d => {
          if (!DEFAULT_TAXONOMY.domains.includes(d)) {
            this.customDomains.add(d);
          }
        });
      }
      
      if (customTaxonomy.subdomains) {
        for (const [domain, subdomains] of Object.entries(customTaxonomy.subdomains)) {
          // If domain doesn't exist in taxonomy, add it
          if (!this.taxonomy.subdomains[domain]) {
            this.taxonomy.subdomains[domain] = [];
          }
          
          // Add any new subdomains
          const existingSubdomains = this.taxonomy.subdomains[domain];
          const newSubdomains = Array.isArray(subdomains) ? subdomains : [subdomains];
          
          const uniqueSubdomains = newSubdomains.filter(s => 
            !existingSubdomains.includes(s)
          );
          
          this.taxonomy.subdomains[domain] = [
            ...existingSubdomains,
            ...uniqueSubdomains
          ];
          
          // Track custom subdomains
          if (!this.customSubdomains.has(domain)) {
            this.customSubdomains.set(domain, new Set());
          }
          uniqueSubdomains.forEach(s => this.customSubdomains.get(domain)?.add(s));
        }
      }
      
      if (customTaxonomy.contextualTags) {
        this.taxonomy.contextualTags = [
          ...this.taxonomy.contextualTags,
          ...customTaxonomy.contextualTags.filter(t => !this.taxonomy.contextualTags.includes(t))
        ];
        customTaxonomy.contextualTags.forEach(t => {
          if (!DEFAULT_TAXONOMY.contextualTags.includes(t)) {
            this.customContextualTags.add(t);
          }
        });
      }
      
      // Life areas and conversation types are more fixed, but still allow customization
      if (customTaxonomy.lifeAreas) {
        this.taxonomy.lifeAreas = customTaxonomy.lifeAreas;
      }
      
      if (customTaxonomy.conversationTypes) {
        this.taxonomy.conversationTypes = customTaxonomy.conversationTypes;
      }
    }
  }
  
  /**
   * Get the complete taxonomy
   */
  getTaxonomy(): Taxonomy {
    return this.taxonomy;
  }
  
  /**
   * Get the taxonomy formatted for the OpenAI prompt
   */
  getTaxonomyForPrompt(): Record<string, unknown> {
    return {
      domains: this.taxonomy.domains,
      subdomains: this.taxonomy.subdomains,
      life_areas: this.taxonomy.lifeAreas,
      conversation_types: this.taxonomy.conversationTypes,
      contextual_tags: this.taxonomy.contextualTags
    };
  }
  
  /**
   * Add a new domain to the taxonomy
   */
  addDomain(domain: string): void {
    if (!this.taxonomy.domains.includes(domain)) {
      this.taxonomy.domains.push(domain);
      this.customDomains.add(domain);
    }
  }
  
  /**
   * Add a new subdomain to the taxonomy
   */
  addSubdomain(domain: string, subdomain: string): void {
    // If domain doesn't exist, add it
    if (!this.taxonomy.domains.includes(domain)) {
      this.addDomain(domain);
    }
    
    // Initialize subdomains for this domain if not already present
    if (!this.taxonomy.subdomains[domain]) {
      this.taxonomy.subdomains[domain] = [];
    }
    
    // Add subdomain if it doesn't already exist
    const domainSubdomains = this.taxonomy.subdomains[domain] as string[];
    if (!domainSubdomains.includes(subdomain)) {
      domainSubdomains.push(subdomain);
      
      // Track custom subdomain
      if (!this.customSubdomains.has(domain)) {
        this.customSubdomains.set(domain, new Set());
      }
      this.customSubdomains.get(domain)?.add(subdomain);
    }
  }
  
  /**
   * Add a new contextual tag to the taxonomy
   */
  addContextualTag(tag: string): void {
    if (!this.taxonomy.contextualTags.includes(tag)) {
      this.taxonomy.contextualTags.push(tag);
      this.customContextualTags.add(tag);
    }
  }
  
  /**
   * Check if a domain exists in the taxonomy
   */
  hasDomain(domain: string): boolean {
    return this.taxonomy.domains.includes(domain);
  }
  
  /**
   * Check if a subdomain exists for a given domain
   */
  hasSubdomain(domain: string, subdomain: string): boolean {
    if (!this.taxonomy.subdomains[domain]) {
      return false;
    }
    
    return (this.taxonomy.subdomains[domain] as string[]).includes(subdomain);
  }
  
  /**
   * Get all subdomains for a given domain
   */
  getSubdomains(domain: string): string[] {
    if (!this.taxonomy.subdomains[domain]) {
      return [];
    }
    
    return this.taxonomy.subdomains[domain] as string[];
  }
  
  /**
   * Get all custom domains added to the taxonomy
   */
  getCustomDomains(): string[] {
    return Array.from(this.customDomains);
  }
  
  /**
   * Get all custom subdomains added to the taxonomy
   */
  getCustomSubdomains(): Map<string, string[]> {
    const result = new Map<string, string[]>();
    for (const [domain, subdomains] of this.customSubdomains.entries()) {
      result.set(domain, Array.from(subdomains));
    }
    return result;
  }
  
  /**
   * Get all custom contextual tags added to the taxonomy
   */
  getCustomContextualTags(): string[] {
    return Array.from(this.customContextualTags);
  }
  
  /**
   * Export the taxonomy to a serializable format
   */
  exportTaxonomy(): Record<string, unknown> {
    return {
      domains: this.taxonomy.domains,
      subdomains: this.taxonomy.subdomains,
      lifeAreas: this.taxonomy.lifeAreas,
      conversationTypes: this.taxonomy.conversationTypes,
      contextualTags: this.taxonomy.contextualTags,
      custom: {
        domains: Array.from(this.customDomains),
        subdomains: Object.fromEntries(
          Array.from(this.customSubdomains.entries()).map(([domain, subdomains]) => 
            [domain, Array.from(subdomains)]
          )
        ),
        contextualTags: Array.from(this.customContextualTags)
      }
    };
  }
  
  /**
   * Import a taxonomy from a serialized format
   */
  static importTaxonomy(data: Record<string, unknown>): TaxonomyManager {
    const taxonomy: Partial<Taxonomy> = {};
    
    if (data.domains && Array.isArray(data.domains)) {
      taxonomy.domains = data.domains as string[];
    }
    
    if (data.subdomains && typeof data.subdomains === 'object') {
      taxonomy.subdomains = data.subdomains as SubdomainMap;
    }
    
    if (data.lifeAreas && Array.isArray(data.lifeAreas)) {
      taxonomy.lifeAreas = data.lifeAreas as LifeAreaTag[];
    }
    
    if (data.conversationTypes && Array.isArray(data.conversationTypes)) {
      taxonomy.conversationTypes = data.conversationTypes as ConversationTypeTag[];
    }
    
    if (data.contextualTags && Array.isArray(data.contextualTags)) {
      taxonomy.contextualTags = data.contextualTags as ContextualTag[];
    }
    
    return new TaxonomyManager(taxonomy);
  }
} 