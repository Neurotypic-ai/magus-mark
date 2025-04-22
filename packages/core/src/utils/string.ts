/**
 * String utility functions for Magus Mark
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
    .replace(/[^a-zA-Z0-9]+(.)/g, (_match: string, char: string) => char.toUpperCase())
    .replace(/^[A-Z]/, (firstChar: string) => firstChar.toLowerCase());
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

/**
 * Format a duration in milliseconds to a human-readable string
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }

  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }

  const minutes = seconds / 60;
  if (minutes < 60) {
    const fullMinutes = Math.floor(minutes);
    const remainingSeconds = seconds - fullMinutes * 60;
    return `${fullMinutes.toString()}m ${remainingSeconds.toFixed(0)}s`;
  }

  const hours = minutes / 60;
  const fullHours = Math.floor(hours);
  const remainingMinutes = Math.floor(minutes - fullHours * 60);
  const remainingSeconds = Math.floor(seconds - fullHours * 3600 - remainingMinutes * 60);
  return `${fullHours.toString()}h ${remainingMinutes.toString()}m ${remainingSeconds.toString()}s`;
}

/**
 * Format a currency amount
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}
