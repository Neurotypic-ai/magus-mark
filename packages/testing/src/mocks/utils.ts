/**
 * Mock utility functions for testing
 */
import { promisify } from 'util';

/**
 * Check if a value is an object (not null)
 * 
 * @param value - Value to check
 * @returns True if the value is an object
 */
function isObjectValue(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

/**
 * Deep merge objects
 * 
 * @param target - Target object to merge into
 * @param source - Source object to merge from
 * @returns A new object with merged properties
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const output = { ...target };
  
  if (isObjectValue(target) && isObjectValue(source)) {
    Object.keys(source).forEach(key => {
      const sourceValue = source[key as keyof typeof source];
      if (isObjectValue(sourceValue)) {
        if (!(key in target)) {
          Object.assign(output, { [key]: sourceValue });
        } else {
          const targetValue = target[key as keyof typeof target];
          if (isObjectValue(targetValue)) {
            // Type assertion needed for compatibility
            output[key as keyof T] = deepMerge(
              targetValue as Record<string, unknown>,
              sourceValue as Record<string, unknown>
            ) as unknown as T[keyof T];
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

/**
 * Creates a partial mock of an object for testing
 * @param original - Original object to create a partial mock of
 * @param overrides - Properties to override
 * @returns Mocked object with overridden properties
 */
export function createPartialMock<T extends object>(original: T, overrides: Partial<T> = {}): T {
  return deepMerge(original as Record<string, unknown>, overrides as Record<string, unknown>) as T;
}

/**
 * Creates a type-safe mock of a complex object
 * @param mockData - Mock data to use
 * @returns A type-safe mock object
 */
export function mockObject<T>(mockData: T): T {
  return mockData;
}

/**
 * Creates a spy function that records its calls
 * @param implementation - Optional implementation for the spy
 * @returns A spy function that records calls
 */
export function createSpy<T extends (...args: unknown[]) => unknown>(
  implementation?: T
): T & { calls: { args: Parameters<T>; result?: ReturnType<T> | undefined }[] } {
  const calls: { args: Parameters<T>; result?: ReturnType<T> | undefined }[] = [];
  
  const spy = ((...args: Parameters<T>): ReturnType<T> => {
    let result: unknown;
    
    if (implementation) {
      result = implementation(...args);
    }
    
    calls.push({ args, result: result as ReturnType<T> | undefined });
    return result as ReturnType<T>;
  }) as T & { calls: typeof calls };
  
  spy.calls = calls;
  return spy;
} 