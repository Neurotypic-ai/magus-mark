import { MarkdownError } from '../errors/MarkdownError';

import type { TagSet } from '../models/TagSet';

/**
 * Markdown processing module for handling files and frontmatter
 */

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
            // Check for malformed array
            if (value.includes('[') && !value.includes(']')) {
              throw new Error('Malformed array in frontmatter');
            }
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
      throw new MarkdownError('Failed to parse frontmatter', {
        code: 'FRONTMATTER_PARSE_ERROR',
        recoverable: true,
      });
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
      const updatedFrontmatter: Record<string, unknown> = {};

      // Copy all existing frontmatter except tags if we're replacing
      for (const [key, value] of Object.entries(existingFrontmatter)) {
        if (this.options.preserveExistingTags || key !== this.options.tagsKey) {
          updatedFrontmatter[key] = value;
        }
      }

      // Update or replace tags
      if (this.options.preserveExistingTags) {
        // Merge existing tags with new ones
        const existingTags = this.extractTags(existingFrontmatter);
        const newTagsArray = newTags[this.options.tagsKey] as string[];

        // Use Set to deduplicate
        const mergedTags = Array.from(new Set([...existingTags, ...newTagsArray]));
        updatedFrontmatter[this.options.tagsKey] = mergedTags;
      } else {
        // Replace existing tags with new ones
        updatedFrontmatter[this.options.tagsKey] = newTags[this.options.tagsKey];
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
      throw new MarkdownError('Failed to update frontmatter', {
        code: 'FRONTMATTER_UPDATE_ERROR',
        recoverable: true,
      });
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
