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
