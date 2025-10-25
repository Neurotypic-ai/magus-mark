import type { TypeCollection } from '../../shared/types/TypeCollection';

/**
 * Converts a TypeCollection to a Map for consistent handling
 * @param collection The collection to convert
 * @returns A Map with string keys and values of type T
 */
export function typeCollectionToMap<T extends { id: string }>(collection: TypeCollection<T>): Map<string, T> {
  if (collection instanceof Map) return collection;
  if (Array.isArray(collection)) {
    return new Map(collection.map((item) => [item.id, item]));
  }
  return new Map(Object.entries(collection));
}

/**
 * Converts a TypeCollection to an array for iteration
 * @param collection The collection to convert
 * @returns An array of items from the collection
 */
export function typeCollectionToArray<T>(collection: TypeCollection<T>): T[] {
  if (Array.isArray(collection)) return collection;
  if (collection instanceof Map) return Array.from(collection.values());
  return Object.values(collection);
}

/**
 * Checks if a TypeCollection has a specific key
 * @param collection The collection to check
 * @param key The key to look for
 * @returns True if the key exists in the collection
 */
export function typeCollectionHasKey<T extends { id: string }>(collection: TypeCollection<T>, key: string): boolean {
  if (collection instanceof Map) return collection.has(key);
  if (Array.isArray(collection)) return collection.some((item) => item.id === key);
  return key in collection;
}

/**
 * Gets a value from a TypeCollection by key
 * @param collection The collection to get from
 * @param key The key to look for
 * @returns The value if found, undefined otherwise
 */
export function typeCollectionGet<T extends { id: string }>(collection: TypeCollection<T>, key: string): T | undefined {
  if (collection instanceof Map) return collection.get(key);
  if (Array.isArray(collection)) return collection.find((item) => item.id === key);
  return collection[key];
}
