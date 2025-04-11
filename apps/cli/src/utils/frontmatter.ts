import type { TagSet } from '@obsidian-magic/types';

/**
 * Regular expression to extract frontmatter from markdown
 * Matches content between --- delimiters at the start of the file
 */
const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;

/**
 * Extract frontmatter from markdown content into a simple object
 */
export function extractFrontmatter(content: string): { frontmatter: Record<string, any> | null; content: string } {
  const match = FRONTMATTER_REGEX.exec(content);
  
  if (!match?.[1]) {
    return { frontmatter: null, content };
  }
  
  try {
    // Use JSON parsing as a safe fallback - convert YAML-like to JSON
    const frontmatterText = match[1];
    const jsonLike = simplifyFrontmatter(frontmatterText);
    const frontmatter = JSON.parse(jsonLike);
    
    return {
      frontmatter,
      content: content.slice(match[0].length),
    };
  } catch (error) {
    console.warn('Failed to parse frontmatter:', error);
    return { frontmatter: null, content };
  }
}

/**
 * Convert YAML-like frontmatter to JSON for safer parsing
 */
function simplifyFrontmatter(text: string): string {
  // Simple YAML to JSON conversion - handles only basic cases
  const lines = text.split('\n');
  const result: Record<string, any> = {};
  
  let currentObj = result;
  const stack: [Record<string, any>, string][] = [];
  let lastIndent = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const indent = line.indexOf(trimmed);
    
    // Handle indentation changes - going back up
    if (indent < lastIndent && stack.length > 0) {
      let lastPoppedIndent = -1;
      while (stack.length > 0 && indent <= lastPoppedIndent) {
        const popped = stack.pop();
        if (popped) {
          const [parent, indentStr] = popped;
          currentObj = parent;
          lastPoppedIndent = indentStr.length;
        } else {
          break;
        }
      }
    }
    
    // Handle key-value pairs
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      let value = trimmed.substring(colonIndex + 1).trim();
      
      // Handle nested objects
      if (!value) {
        const newObj: Record<string, any> = {};
        currentObj[key] = newObj;
        stack.push([currentObj, ' '.repeat(indent)]);
        currentObj = newObj;
        lastIndent = indent;
        continue;
      }
      
      // Handle value types
      if (value === 'true') {
        currentObj[key] = true;
      } else if (value === 'false') {
        currentObj[key] = false;
      } else if (value === 'null') {
        currentObj[key] = null;
      } else if (/^-?\d+$/.test(value)) {
        currentObj[key] = parseInt(value, 10);
      } else if (/^-?\d+\.\d+$/.test(value)) {
        currentObj[key] = parseFloat(value);
      } else if ((value.startsWith('"') && value.endsWith('"')) || 
                 (value.startsWith("'") && value.endsWith("'"))) {
        currentObj[key] = value.substring(1, value.length - 1);
      } else {
        currentObj[key] = value;
      }
    }
  }
  
  return JSON.stringify(result);
}

/**
 * Add frontmatter to markdown content
 */
export function addFrontmatter(content: string, data: Record<string, any>): string {
  const yaml = convertToYaml(data);
  return `---\n${yaml}\n---\n\n${content}`;
}

/**
 * Very simple object to YAML converter
 */
function convertToYaml(obj: Record<string, any>, level = 0): string {
  const indent = ' '.repeat(level);
  const lines: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      lines.push(`${indent}${key}:`);
    } else if (typeof value === 'string') {
      // Quote strings that might cause issues in YAML
      if (value.includes('"') || value.includes("'") || value.includes('\n') || 
          value.includes(':') || value.trim() !== value) {
        lines.push(`${indent}${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${indent}${key}: ${value}`);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${indent}${key}: ${value}`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${indent}${key}: []`);
      } else {
        lines.push(`${indent}${key}:`);
        for (const item of value) {
          const itemStr = typeof item === 'object' ? JSON.stringify(item) : String(item);
          lines.push(`${indent}  - ${itemStr}`);
        }
      }
    } else if (typeof value === 'object') {
      lines.push(`${indent}${key}:`);
      lines.push(convertToYaml(value, level + 2));
    }
  }
  
  return lines.join('\n');
}

/**
 * Update frontmatter in markdown content
 */
export function updateFrontmatter(content: string, newData: Record<string, any>): string {
  const { frontmatter, content: contentWithoutFrontmatter } = extractFrontmatter(content);
  
  const updatedFrontmatter = {
    ...(frontmatter || {}),
    ...newData,
  };
  
  return addFrontmatter(contentWithoutFrontmatter, updatedFrontmatter);
}

/**
 * Extract tags from frontmatter
 */
export function extractTagsFromFrontmatter(content: string): TagSet | undefined {
  const { frontmatter } = extractFrontmatter(content);
  
  if (!frontmatter || typeof frontmatter !== 'object') {
    return undefined;
  }
  
  try {
    const tags = frontmatter['tags'];
    if (tags && typeof tags === 'object' && tags.obsidianMagic) {
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
  
  // Get existing tags, if any
  const existingTags = frontmatter?.['tags'] && typeof frontmatter['tags'] === 'object' 
    ? frontmatter['tags'] 
    : {};
  
  const updatedFrontmatter = {
    ...(frontmatter || {}),
    tags: {
      ...existingTags,
      obsidianMagic: tags,
    },
  };
  
  return addFrontmatter(contentWithoutFrontmatter, updatedFrontmatter);
} 