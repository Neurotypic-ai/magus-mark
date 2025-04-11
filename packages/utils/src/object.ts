/**
 * Object utility functions for Obsidian Magic
 */

/**
 * Safe check if a value is an object
 * @param value - The value to check
 * @returns True if the value is an object
 */
export function isObject(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep merge objects
 *
 * @param target - Target object to merge into
 * @param source - Source object to merge from
 * @returns A new object with merged properties
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
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
 * Safely access deeply nested object properties
 *
 * @param obj - Object to access properties from
 * @param path - Path to the property as string with dot notation
 * @param defaultValue - Default value to return if path doesn't exist
 * @returns The value at path or defaultValue if not found
 */
export function get<T, D = undefined>(
  obj: Record<string, any> | undefined,
  path: string,
  defaultValue?: D
): T | D | undefined {
  if (!obj || typeof path !== 'string') {
    return defaultValue;
  }

  const keys = path.split('.');
  let result: any = obj;

  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue;
    }
    result = result[key];
  }

  return result === undefined ? defaultValue : result;
}

/**
 * Safely check if an object has a property
 *
 * @param obj - Object to check
 * @param key - Key to check for
 * @returns True if the object has the key
 */
export function has(obj: unknown, key: string): boolean {
  return obj !== null && obj !== undefined && Object.prototype.hasOwnProperty.call(obj, key);
}
