/**
 * Markdown processing module for handling files and frontmatter
 */
import type { 
  TagSet, 
  Document, 
  DomainTag, 
  TopicalTag, 
  YearTag, 
  LifeAreaTag, 
  ConversationTypeTag,
  SubdomainTag
} from '@obsidian-magic/types';
import { MarkdownError } from '../errors';

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
  useNestedKeys: false
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
    const match = content.match(frontmatterRegex);
    
    if (!match || !match[1]) {
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
            frontmatter[key] = value.split(',').map(v => v.trim());
          } else {
            frontmatter[key] = value;
          }
        }
      }
      
      return frontmatter;
    } catch (error) {
      console.error('Error parsing frontmatter:', error);
      throw new MarkdownError(
        'Failed to parse frontmatter',
        'FRONTMATTER_PARSE_ERROR',
        true
      );
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
      const tagsStr = frontmatter[tagsKey] as string;
      tags = tagsStr.split(',').map(t => t.trim());
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
          tagParts.push(topicalTag.subdomain as string);
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
        result['topical_tags'] = tags.topical_tags.map(tag => {
          const topical: Record<string, string> = {
            domain: tag.domain as string
          };
          
          if (tag.subdomain) {
            topical['subdomain'] = tag.subdomain as string;
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
    const match = content.match(frontmatterRegex);
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
      throw new MarkdownError(
        'Failed to update frontmatter',
        'FRONTMATTER_UPDATE_ERROR',
        true
      );
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
            return `${key}: [${value[0]}]`;
          } else {
            return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
          }
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested objects (simplified)
          return `${key}:\n  ${JSON.stringify(value)}`;
        } else {
          return `${key}: ${value}`;
        }
      })
      .join('\n');
  }
}

/**
 * Process markdown documents with frontmatter
 */
export class DocumentProcessor {
  private frontmatterProcessor: FrontmatterProcessor;
  
  constructor(frontmatterOptions: Partial<FrontmatterOptions> = {}) {
    this.frontmatterProcessor = new FrontmatterProcessor(frontmatterOptions);
  }
  
  /**
   * Parse a markdown document from content
   */
  parseDocument(id: string, path: string, content: string): Document {
    const metadata = this.frontmatterProcessor.extractFrontmatter(content);
    const extractedContent = this.extractContent(content);
    
    // Try to extract existing tags
    const existingTags = this.tryExtractTagsFromFrontmatter(metadata);
    
    return {
      id,
      path,
      content: extractedContent,
      metadata,
      existingTags
    };
  }
  
  /**
   * Update document with new tags
   */
  updateDocument(document: Document, tags: TagSet): string {
    // Apply tags to document content via frontmatter
    return this.frontmatterProcessor.updateFrontmatter(document.content, tags);
  }
  
  /**
   * Extract the main content from a markdown document (excluding frontmatter)
   */
  extractContent(content: string): string {
    const frontmatterRegex = /^---\n[\s\S]*?\n---\n?/;
    return content.replace(frontmatterRegex, '').trim();
  }
  
  /**
   * Try to extract tag metadata from frontmatter
   */
  private tryExtractTagsFromFrontmatter(frontmatter: Record<string, unknown>): TagSet | undefined {
    // Check if we have nested tag keys that match our expected structure
    const hasNestedTags = 
      frontmatter['year'] !== undefined ||
      frontmatter['life_area'] !== undefined ||
      frontmatter['topical_tags'] !== undefined ||
      frontmatter['conversation_type'] !== undefined;
    
    if (hasNestedTags) {
      try {
        // Extract structured tags from nested keys
        const yearRaw = frontmatter['year'] as string;
        // Convert year to YearTag (must be a valid 4-digit year)
        if (!yearRaw || !/^\d{4}$/.test(yearRaw)) {
          return undefined;
        }
        const year = yearRaw as YearTag;
        
        const lifeArea = frontmatter['life_area'] as LifeAreaTag | undefined;
        const topicalTagsRaw = frontmatter['topical_tags'] as Array<Record<string, unknown>> || [];
        const conversationType = frontmatter['conversation_type'] as ConversationTypeTag;
        
        // Only return if we have at least year and conversation_type
        if (year && conversationType) {
          // Convert raw topical tags to properly typed TopicalTag array
          const topicalTags: TopicalTag[] = [];
          
          for (const tag of topicalTagsRaw) {
            const domain = tag['domain'] as DomainTag;
            if (!domain) continue;
            
            const topicalTag: TopicalTag = { domain };
            
            // Add subdomain if exists
            if (tag['subdomain']) {
              topicalTag.subdomain = tag['subdomain'] as SubdomainTag;
            }
            
            // Add contextual if exists
            if (tag['contextual']) {
              topicalTag.contextual = tag['contextual'] as string;
            }
            
            topicalTags.push(topicalTag);
          }
          
          return {
            year,
            life_area: lifeArea,
            topical_tags: topicalTags,
            conversation_type: conversationType,
            confidence: {
              // Default to high confidence since these are explicit tags
              overall: 1.0,
              year: 1.0,
              life_area: lifeArea ? 1.0 : 0,
              domain: 1.0,
              subdomain: 1.0,
              contextual: 1.0,
              conversation_type: 1.0
            }
          };
        }
      } catch (error) {
        // If anything goes wrong, fall back to undefined
        console.error('Error extracting structured tags:', error);
        return undefined;
      }
    }
    
    // No structured tags found, try to parse from flat tag list
    const tags = this.frontmatterProcessor.extractTags(frontmatter);
    
    if (tags.length === 0) {
      return undefined;
    }
    
    try {
      // Try to parse flat tags into structured format
      const yearTag = tags.find(t => t.startsWith('#year/'));
      const typeTag = tags.find(t => t.startsWith('#type/'));
      
      if (!yearTag || !typeTag) {
        return undefined;
      }
      
      const lifeAreaTags = tags.filter(t => 
        t.startsWith('#') && 
        !t.includes('/') && 
        !t.startsWith('#year/') && 
        !t.startsWith('#type/')
      );
      
      const domainTags = tags.filter(t => 
        t.includes('/') && 
        !t.startsWith('#year/') && 
        !t.startsWith('#type/')
      );
      
      const rawYear = yearTag.replace('#year/', '');
      // Convert to YearTag format (must be a valid 4-digit year)
      if (!rawYear || !/^\d{4}$/.test(rawYear)) {
        return undefined;
      }
      const year = rawYear as YearTag;
      
      const conversationType = typeTag.replace('#type/', '') as ConversationTypeTag;
      const lifeArea = lifeAreaTags.length > 0 
        ? lifeAreaTags[0].replace('#', '') as LifeAreaTag 
        : undefined;
      
      const topicalTags: TopicalTag[] = [];
      
      for (const tag of domainTags) {
        // Remove leading # and split by /
        const parts = tag.substring(1).split('/');
        if (parts.length === 0) continue;
        
        const domain = parts[0] as DomainTag;
        const topicalTag: TopicalTag = { domain };
        
        if (parts.length >= 2) {
          topicalTag.subdomain = parts[1] as SubdomainTag;
        }
        
        if (parts.length >= 3) {
          topicalTag.contextual = parts[2];
        }
        
        topicalTags.push(topicalTag);
      }
      
      return {
        year,
        life_area: lifeArea,
        topical_tags: topicalTags,
        conversation_type: conversationType,
        confidence: {
          // Default to high confidence since these are explicit tags
          overall: 1.0,
          year: 1.0,
          life_area: lifeArea ? 1.0 : 0,
          domain: 1.0,
          subdomain: 1.0,
          contextual: 1.0,
          conversation_type: 1.0
        }
      };
    } catch (error) {
      console.error('Error parsing flat tags:', error);
      return undefined;
    }
  }
} 