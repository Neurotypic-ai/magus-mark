/**
 * Markdown processing module for handling files and frontmatter
 */
import { MarkdownError } from './errors';

import type {
  ContextualTag,
  ConversationTypeTag,
  Document,
  DomainTag,
  LifeAreaTag,
  SubdomainTag,
  TagSet,
  YearTag,
} from '@obsidian-magic/types';

/**
 * Options for frontmatter processing
 */
export interface FrontmatterOptions {
  /**
   * Whether to preserve existing tags in the frontmatter
   */
  preserveExistingTags: boolean;

  /**
   * The key to use for tags in the frontmatter
   */
  tagsKey: string;

  /**
   * Whether to use nested keys for complex tag hierarchies
   */
  useNestedKeys: boolean;

  /**
   * Custom formatter for tags in the frontmatter
   */
  tagFormatter?: (tag: string) => string;
}

/**
 * Default frontmatter options
 */
export const DEFAULT_FRONTMATTER_OPTIONS: FrontmatterOptions = {
  preserveExistingTags: true,
  tagsKey: 'tags',
  useNestedKeys: false,
};

/**
 * Frontmatter utilities for working with YAML frontmatter in markdown files
 */
export class FrontmatterProcessor {
  private options: FrontmatterOptions;

  constructor(options: Partial<FrontmatterOptions> = {}) {
    this.options = { ...DEFAULT_FRONTMATTER_OPTIONS, ...options };
  }

  /**
   * Extract frontmatter from markdown content
   */
  extractFrontmatter(content: string): Record<string, unknown> {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = frontmatterRegex.exec(content);

    if (!match?.[1]) {
      return {};
    }

    try {
      // This is a simplified implementation
      // In a real implementation, we would properly parse the YAML
      const frontmatter: Record<string, unknown> = {};
      const lines = match[1].split('\n');

      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          let value = line.substring(colonIndex + 1).trim();

          // Handle array values
          if (value.startsWith('[') && value.endsWith(']')) {
            value = value.substring(1, value.length - 1);
            frontmatter[key] = value.split(',').map((v) => v.trim());
          } else {
            frontmatter[key] = value;
          }
        }
      }

      return frontmatter;
    } catch (error) {
      console.error('Error parsing frontmatter:', error);
      throw new MarkdownError('Failed to parse frontmatter', 'FRONTMATTER_PARSE_ERROR', true);
    }
  }

  /**
   * Extract existing tags from frontmatter
   */
  extractTags(frontmatter: Record<string, unknown>): string[] {
    const tagsKey = this.options.tagsKey;
    let tags: string[] = [];

    if (Array.isArray(frontmatter[tagsKey])) {
      tags = frontmatter[tagsKey] as string[];
    } else if (typeof frontmatter[tagsKey] === 'string') {
      const tagsStr = frontmatter[tagsKey];
      tags = tagsStr.split(',').map((t) => t.trim());
    }

    return tags;
  }

  /**
   * Convert a TagSet to frontmatter format
   */
  tagsToFrontmatter(tags: TagSet): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const tagsArray: string[] = [];

    // Year tag
    tagsArray.push(`#year/${tags.year}`);

    // Life area tag
    if (tags.life_area) {
      tagsArray.push(`#${tags.life_area}`);
    }

    // Topical tags
    for (const topicalTag of tags.topical_tags) {
      if (topicalTag.domain) {
        const tagParts = [topicalTag.domain];

        if (topicalTag.subdomain) {
          // Type assertion to handle any subdomain
          tagParts.push(topicalTag.subdomain);
        }

        if (topicalTag.contextual) {
          // Contextual tags can be any string
          tagParts.push(topicalTag.contextual);
        }

        tagsArray.push(`#${tagParts.join('/')}`);
      }
    }

    // Conversation type tag
    tagsArray.push(`#type/${tags.conversation_type}`);

    // Format tags if needed
    if (this.options.tagFormatter) {
      result[this.options.tagsKey] = tagsArray.map(this.options.tagFormatter);
    } else {
      result[this.options.tagsKey] = tagsArray;
    }

    // If using nested keys, create hierarchical structure
    if (this.options.useNestedKeys) {
      result['year'] = tags.year;

      if (tags.life_area) {
        result['life_area'] = tags.life_area;
      }

      if (tags.topical_tags.length > 0) {
        result['topical_tags'] = tags.topical_tags.map((tag) => {
          const topical: Record<string, string> = {
            domain: tag.domain,
          };

          if (tag.subdomain) {
            topical['subdomain'] = tag.subdomain;
          }

          if (tag.contextual) {
            topical['contextual'] = tag.contextual;
          }

          return topical;
        });
      }

      result['conversation_type'] = tags.conversation_type;
    }

    return result;
  }

  /**
   * Update markdown content with new tags
   */
  updateFrontmatter(content: string, tags: TagSet): string {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = frontmatterRegex.exec(content);
    const newTags = this.tagsToFrontmatter(tags);

    if (!match) {
      // No existing frontmatter, create new one
      const frontmatter = `---\n${this.formatFrontmatter(newTags)}\n---`;
      return `${frontmatter}\n\n${content}`;
    }

    try {
      const existingFrontmatter = this.extractFrontmatter(content);
      const updatedFrontmatter = { ...existingFrontmatter };

      // Update or replace tags
      if (this.options.preserveExistingTags) {
        // Merge existing tags with new ones
        const existingTags = this.extractTags(existingFrontmatter);
        const newTagsArray = newTags[this.options.tagsKey] as string[];

        // Use Set to deduplicate
        const mergedTags = Array.from(new Set([...existingTags, ...newTagsArray]));
        updatedFrontmatter[this.options.tagsKey] = mergedTags;
      } else {
        // Replace existing tags
        Object.assign(updatedFrontmatter, newTags);
      }

      // If using nested keys, update those as well
      if (this.options.useNestedKeys) {
        Object.assign(updatedFrontmatter, newTags);
      }

      // Replace frontmatter in content
      const formattedFrontmatter = `---\n${this.formatFrontmatter(updatedFrontmatter)}\n---`;
      return content.replace(frontmatterRegex, formattedFrontmatter);
    } catch (error) {
      console.error('Error updating frontmatter:', error);
      throw new MarkdownError('Failed to update frontmatter', 'FRONTMATTER_UPDATE_ERROR', true);
    }
  }

  /**
   * Format a frontmatter object into YAML string
   */
  private formatFrontmatter(frontmatter: Record<string, unknown>): string {
    // This is a simplified implementation
    // In a real implementation, we would properly format YAML
    return Object.entries(frontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return `${key}: []`;
          } else if (value.length === 1) {
            return `${key}: [${String(value[0])}]`;
          } else {
            return `${key}:\n${value.map((v) => `  - ${String(v)}`).join('\n')}`;
          }
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested objects (simplified)
          return `${key}:\n  ${JSON.stringify(value)}`;
        } else {
          return `${key}: ${String(value)}`;
        }
      })
      .join('\n');
  }
}

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
