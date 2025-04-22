/**
 * Object utility functions for Magus Mark
 */

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
 *
 * @param target - Target object to merge into
 * @param source - Source object to merge from
 * @returns A new object with merged properties
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      if (isObject(sourceValue)) {
        if (!(key in target)) {
          Object.assign(output, { [key]: sourceValue });
        } else {
          const targetValue = target[key as keyof typeof target];
          if (isObject(targetValue)) {
            output[key as keyof T] = deepMerge(
              targetValue as Record<string, unknown>,
              sourceValue as Record<string, unknown>
            ) as T[keyof T];
          } else {
            output[key as keyof T] = sourceValue as T[keyof T];
          }
        }
      } else {
        Object.assign(output, { [key]: sourceValue });
      }
    });
  }

  return output;
}
