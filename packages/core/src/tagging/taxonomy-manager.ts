/**
 * Taxonomy management for the tagging system
 */
import { DEFAULT_TAXONOMY } from '../models/taxonomy';

import type { ContextualTag, ConversationTypeTag, LifeAreaTag, SubdomainMap } from '../models/tags';
import type { Taxonomy } from '../models/taxonomy';

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
        this.taxonomy.domains = [
          ...this.taxonomy.domains,
          ...customTaxonomy.domains.filter((d) => !this.taxonomy.domains.includes(d)),
        ];
        customTaxonomy.domains.forEach((d) => {
          if (!DEFAULT_TAXONOMY.domains.includes(d)) {
            this.customDomains.add(d);
          }
        });
      }

      if (customTaxonomy.subdomains) {
        for (const [domain, subdomains] of Object.entries(customTaxonomy.subdomains)) {
          // If domain doesn't exist in taxonomy, add it
          this.taxonomy.subdomains[domain] ??= [];

          // Add any new subdomains
          const existingSubdomains = this.taxonomy.subdomains[domain];
          const newSubdomains = Array.isArray(subdomains) ? subdomains : [subdomains];

          const uniqueSubdomains = newSubdomains.filter((s) => {
            // Handle both string and array cases safely
            return typeof existingSubdomains === 'string'
              ? existingSubdomains !== s
              : !existingSubdomains.includes(s as string);
          });

          // Safely merge arrays without using spread on potentially string values
          this.taxonomy.subdomains[domain] = Array.isArray(existingSubdomains)
            ? Array.prototype.concat(existingSubdomains, uniqueSubdomains)
            : uniqueSubdomains;

          // Track custom subdomains
          if (!this.customSubdomains.has(domain)) {
            this.customSubdomains.set(domain, new Set());
          }

          uniqueSubdomains.forEach((s) => {
            const subdomain = this.customSubdomains.get(domain);
            if (subdomain) {
              subdomain.add(s as string);
            }
          });
        }
      }

      if (customTaxonomy.contextualTags) {
        this.taxonomy.contextualTags = [
          ...this.taxonomy.contextualTags,
          ...customTaxonomy.contextualTags.filter((t) => !this.taxonomy.contextualTags.includes(t)),
        ];
        customTaxonomy.contextualTags.forEach((t) => {
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
      contextual_tags: this.taxonomy.contextualTags,
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
    this.taxonomy.subdomains[domain] ??= [];

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
          Array.from(this.customSubdomains.entries()).map(([domain, subdomains]) => [domain, Array.from(subdomains)])
        ),
        contextualTags: Array.from(this.customContextualTags),
      },
    };
  }

  /**
   * Import a taxonomy from a serialized format
   */
  static importTaxonomy(data: Record<string, unknown>): TaxonomyManager {
    const taxonomy: Partial<Taxonomy> = {};

    if (data['domains'] && Array.isArray(data['domains'])) {
      taxonomy.domains = data['domains'] as string[];
    }

    if (data['subdomains'] && typeof data['subdomains'] === 'object') {
      taxonomy.subdomains = data['subdomains'] as SubdomainMap;
    }

    if (data['lifeAreas'] && Array.isArray(data['lifeAreas'])) {
      // Use type assertion with unknown first to avoid direct string[] to enum[] conversion
      taxonomy.lifeAreas = data['lifeAreas'] as unknown as LifeAreaTag[];
    }

    if (data['conversationTypes'] && Array.isArray(data['conversationTypes'])) {
      // Use type assertion with unknown first to avoid direct string[] to enum[] conversion
      taxonomy.conversationTypes = data['conversationTypes'] as unknown as ConversationTypeTag[];
    }

    if (data['contextualTags'] && Array.isArray(data['contextualTags'])) {
      taxonomy.contextualTags = data['contextualTags'] as unknown as ContextualTag[];
    }

    return new TaxonomyManager(taxonomy);
  }
}
