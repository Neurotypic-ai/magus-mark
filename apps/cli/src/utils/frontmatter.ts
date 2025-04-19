import * as yaml from 'js-yaml';

import type { TagSet } from '@obsidian-magic/core/models/TagSet';

/**
 * Type definitions for frontmatter data
 * Using a recursive type definition that can handle arbitrary data
 */
interface FrontmatterObject {
  [key: string]: FrontmatterValue;
}

type FrontmatterPrimitive = string | number | boolean | null;
type FrontmatterValue = FrontmatterPrimitive | FrontmatterObject | FrontmatterValue[];

/**
 * Regular expression to extract frontmatter from markdown
 * Matches content between --- delimiters at the start of the file
 */
const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;

/**
 * Extract frontmatter from markdown content using js-yaml
 */
export function extractFrontmatter(content: string): { frontmatter: FrontmatterObject | null; content: string } {
  const match = FRONTMATTER_REGEX.exec(content);

  if (!match?.[1]) {
    return { frontmatter: null, content };
  }

  try {
    const frontmatterText = match[1];
    const frontmatter = yaml.load(frontmatterText) as FrontmatterObject;

    // Ensure the parsed result is an object, not null or other primitive
    if (typeof frontmatter !== 'object') {
      // Treat non-object frontmatter (like empty `--- ---`) as empty object
      if (frontmatterText.trim() === '') {
        return {
          frontmatter: {},
          content: content.slice(match[0].length),
        };
      }
      console.warn('Parsed frontmatter is not an object, returning null.');
      return { frontmatter: null, content: content.slice(match[0].length) };
    }

    return {
      frontmatter,
      content: content.slice(match[0].length),
    };
  } catch (error) {
    console.warn(`Failed to parse frontmatter with js-yaml: ${error instanceof Error ? error.message : String(error)}`);
    // Keep original content if parsing fails
    return { frontmatter: null, content };
  }
}

/**
 * Add frontmatter to markdown content using js-yaml
 */
export function addFrontmatter(content: string, data: FrontmatterObject): string {
  try {
    const yamlString = yaml.dump(data, { noRefs: true, lineWidth: -1 });
    // Ensure there's a newline after the frontmatter
    const contentWithNewline = content.startsWith('\n') ? content : `\n${content}`;
    return `---\n${yamlString}---\n${contentWithNewline}`;
  } catch (error) {
    console.error(`Failed to dump frontmatter to YAML: ${error instanceof Error ? error.message : String(error)}`);
    // Return original content if dumping fails
    return content;
  }
}

/**
 * Update frontmatter in markdown content
 */
export function updateFrontmatter(content: string, newData: FrontmatterObject): string {
  const { frontmatter, content: contentWithoutFrontmatter } = extractFrontmatter(content);

  const updatedFrontmatter = {
    ...(frontmatter ?? {}),
    ...newData,
  };

  return addFrontmatter(contentWithoutFrontmatter, updatedFrontmatter);
}

/**
 * Type guard to check if an object might contain obsidianMagic tags
 */
function isTagsObject(obj: unknown): obj is { obsidianMagic: unknown } {
  return typeof obj === 'object' && obj !== null && 'obsidianMagic' in obj;
}

/**
 * Extract tags from frontmatter
 */
export function extractTagsFromFrontmatter(content: string): TagSet | undefined {
  const { frontmatter } = extractFrontmatter(content);

  if (!frontmatter) {
    return undefined;
  }

  try {
    const tags = frontmatter['tags'];
    if (tags && typeof tags === 'object' && isTagsObject(tags)) {
      // We've verified the object has an obsidianMagic property
      // We trust that it's a TagSet
      return tags.obsidianMagic as TagSet;
    }
  } catch (error) {
    console.warn('Failed to extract tags from frontmatter:', error);
  }

  return undefined;
}

/**
 * Update tags in frontmatter
 */
export function updateTagsInFrontmatter(content: string, tags: TagSet): string {
  const { frontmatter, content: contentWithoutFrontmatter } = extractFrontmatter(content);

  // Ensure frontmatter is an object before proceeding
  const baseFrontmatter = frontmatter ?? {};

  // Get existing tags object, ensuring it's treated as an object
  const existingTagsObj = baseFrontmatter['tags'];
  const existingTags: Record<string, unknown> =
    existingTagsObj && typeof existingTagsObj === 'object' && !Array.isArray(existingTagsObj)
      ? (existingTagsObj as Record<string, unknown>)
      : {};

  // Create updated frontmatter
  const updatedFrontmatter: FrontmatterObject = {
    ...baseFrontmatter,
    tags: {
      ...existingTags,
      // Use the TagSet directly, js-yaml will handle serialization
      obsidianMagic: tags as unknown as FrontmatterValue,
    },
  };

  // Use the updated addFrontmatter which uses js-yaml
  return addFrontmatter(contentWithoutFrontmatter, updatedFrontmatter);
}
