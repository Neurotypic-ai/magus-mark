import { FrontmatterProcessor } from './FrontmatterProcessor';

import type { ContextualTag } from '../models/ContextualTag';
import type { ConversationTypeTag } from '../models/ConversationTypeTag';
import type { Document } from '../models/Document';
import type { DomainTag } from '../models/DomainTag';
import type { LifeAreaTag } from '../models/LifeAreaTag';
import type { SubdomainTag } from '../models/SubdomainTag';
import type { TagSet } from '../models/TagSet';
import type { YearTag } from '../models/YearTag';
import type { FrontmatterOptions } from './FrontmatterProcessor';

/**
 * Document processor for handling markdown documents
 */

export class DocumentProcessor {
  private frontmatterProcessor: FrontmatterProcessor;

  constructor(frontmatterOptions: Partial<FrontmatterOptions> = {}) {
    this.frontmatterProcessor = new FrontmatterProcessor(frontmatterOptions);
  }

  /**
   * Parse document content into a structured Document object
   */
  parseDocument(id: string, path: string, content: string): Document {
    const frontmatter = this.frontmatterProcessor.extractFrontmatter(content);
    const extractedTags = this.tryExtractTagsFromFrontmatter(frontmatter);
    const body = this.extractContent(content);

    return {
      id,
      path,
      content: body,
      metadata: frontmatter,
      existingTags: extractedTags,
    };
  }

  /**
   * Update a document with new tags
   */
  updateDocument(document: Document, tags: TagSet): string {
    return this.frontmatterProcessor.updateFrontmatter(document.content, tags);
  }

  /**
   * Extract content without frontmatter
   */
  extractContent(content: string): string {
    return content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
  }

  /**
   * Try to extract structured tags from frontmatter
   */
  private tryExtractTagsFromFrontmatter(frontmatter: Record<string, unknown>): TagSet | undefined {
    try {
      const tags = this.frontmatterProcessor.extractTags(frontmatter);
      if (!tags.length) {
        return undefined;
      }

      const currentYear = String(new Date().getFullYear()) as YearTag;

      // Initialize the tag structure
      const result: TagSet = {
        year: currentYear, // Default to current year if not found
        topical_tags: [],
        conversation_type: 'analysis' as ConversationTypeTag, // Default conversation type
        confidence: { overall: 1.0 }, // This is from existing tags, so confidence is 1.0
      };

      // Process each tag
      for (const tag of tags) {
        // Skip tags that don't start with #
        if (!tag.startsWith('#')) {
          continue;
        }

        // Remove the # and split by /
        const parts = tag.substring(1).split('/');
        if (!parts.length) continue;

        // Process based on tag type
        switch (parts[0]) {
          case 'year':
            if (parts.length === 2 && /^\d{4}$/.test(parts[1] ?? '')) {
              result.year = parts[1] as YearTag;
            }
            break;

          case 'life':
            if (parts.length === 2 && parts[1]) {
              result.life_area = parts[1] as LifeAreaTag;
            }
            break;

          case 'topic':
            if (parts.length >= 2 && parts[1]) {
              const topical: {
                domain: DomainTag;
                subdomain?: SubdomainTag;
                contextual?: ContextualTag;
              } = {
                domain: parts[1] as DomainTag,
              };

              if (parts.length >= 3 && parts[2]) {
                topical.subdomain = parts[2];
              }

              if (parts.length >= 4 && parts[3]) {
                topical.contextual = parts[3] as ContextualTag;
              }

              result.topical_tags.push(topical);
            }
            break;

          case 'type':
            if (parts.length === 2 && parts[1]) {
              result.conversation_type = parts[1] as ConversationTypeTag;
            }
            break;

          // Handle other types like direct domain tags without topic/ prefix
          default:
            if (parts.length === 1) {
              // Could be a direct domain tag
              result.topical_tags.push({
                domain: parts[0] as DomainTag,
              });
            } else if (parts.length >= 2 && parts[0] && parts[1]) {
              // Could be domain/subdomain or domain/subdomain/contextual
              const topical: {
                domain: DomainTag;
                subdomain?: SubdomainTag;
                contextual?: ContextualTag;
              } = {
                domain: parts[0] as DomainTag,
              };

              if (parts.length >= 2 && parts[1]) {
                topical.subdomain = parts[1];
              }

              if (parts.length >= 3 && parts[2]) {
                topical.contextual = parts[2] as ContextualTag;
              }

              result.topical_tags.push(topical);
            }
            break;
        }
      }

      // Only return a valid result if we have at least one topical tag
      return result.topical_tags.length > 0 ? result : undefined;
    } catch (error) {
      console.warn('Failed to extract tags from frontmatter:', error);
      return undefined;
    }
  }
}
