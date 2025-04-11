// Import the utility functions from the shared package
// This allows us to use the same functions across the codebase
import { formatDuration, formatCurrency } from '../../packages/utils/src/string';

// Re-export the functions 
export { formatDuration, formatCurrency };

/**
 * Safe check if a value is an object
 * @param value - The value to check
 * @returns True if the value is an object
 */
function isObject(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceValue = source[key as keyof typeof source];
      if (isObject(sourceValue)) {
        if (!(key in target)) {
          Object.assign(output, { [key]: sourceValue });
        } else {
          const targetValue = target[key as keyof typeof target];
          if (isObject(targetValue)) {
            output[key as keyof T] = deepMerge(
              targetValue as Record<string, any>,
              sourceValue as Record<string, any>
            ) as any;
          } else {
            output[key as keyof T] = sourceValue as any;
          }
        }
      } else {
        Object.assign(output, { [key]: sourceValue });
      }
    });
  }
  
  return output;
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
    return `${fullMinutes}m ${remainingSeconds.toFixed(0)}s`;
  }
  
  const hours = minutes / 60;
  const fullHours = Math.floor(hours);
  const remainingMinutes = Math.floor(minutes - fullHours * 60);
  const remainingSeconds = Math.floor(seconds - fullHours * 3600 - remainingMinutes * 60);
  return `${fullHours}h ${remainingMinutes}m ${remainingSeconds}s`;
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
    maximumFractionDigits: 4
  }).format(amount);
} 