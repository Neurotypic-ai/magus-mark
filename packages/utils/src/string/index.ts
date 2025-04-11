/**
 * String utility functions for Obsidian Magic
 */

/**
 * Truncates a string to a maximum length, adding an ellipsis if truncated
 * @param text - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Converts a string to kebab-case
 * @param text - String to convert
 * @returns Kebab-case string
 */
export function toKebabCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Convert camelCase to kebab-case
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9-]/g, '') // Remove non-alphanumeric characters except hyphens
    .toLowerCase();
}

/**
 * Converts a string to camelCase
 * @param text - String to convert
 * @returns camelCase string
 */
export function toCamelCase(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, firstChar => firstChar.toLowerCase());
}

/**
 * Converts a string to PascalCase
 * @param text - String to convert
 * @returns PascalCase string
 */
export function toPascalCase(text: string): string {
  const camelCase = toCamelCase(text);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

/**
 * Extracts YAML frontmatter from a markdown document
 * @param content - Markdown content
 * @returns Frontmatter string or null if not found
 */
export function extractFrontmatter(content: string): string | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

/**
 * Removes YAML frontmatter from a markdown document
 * @param content - Markdown content
 * @returns Content without frontmatter
 */
export function removeFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n?/, '');
}

/**
 * Slugifies a string for URLs or filenames
 * @param text - String to slugify
 * @returns Slugified string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalizes different types of line endings to \n
 * @param text - String to normalize
 * @returns Normalized string
 */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n|\r/g, '\n');
}

/**
 * Escapes regular expression special characters
 * @param text - String to escape
 * @returns Escaped string
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes a string to be safe for use in HTML
 * @param html - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates a random string with specified length
 * @param length - Length of the random string
 * @returns Random string
 */
export function randomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  return result;
} 