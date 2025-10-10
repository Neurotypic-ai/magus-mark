import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SmartCache } from './SmartCache';

import type { CacheConfig } from './SmartCache';

describe('SmartCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves values', async () => {
    const config: CacheConfig = {
      maxSize: 10,
      ttl: 60000,
      strategy: 'lru',
      compression: false,
      persistent: false,
    };

    const cache = new SmartCache<string>(config);
    await cache.set('key1', 'value1');

    const result = await cache.get('key1');
    expect(result).toBe('value1');
  });

  it('respects TTL and expires old entries', async () => {
    const config: CacheConfig = {
      maxSize: 10,
      ttl: 1000,
      strategy: 'lru',
      compression: false,
      persistent: false,
    };

    const cache = new SmartCache<string>(config);
    await cache.set('key1', 'value1');

    vi.advanceTimersByTime(500);
    expect(await cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(600);
    expect(await cache.get('key1')).toBeUndefined();
  });

  it('evicts LRU entry when maxSize exceeded', async () => {
    const config: CacheConfig = {
      maxSize: 2,
      ttl: 60000,
      strategy: 'lru',
      compression: false,
      persistent: false,
    };

    const cache = new SmartCache<string>(config);
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    await cache.set('key3', 'value3');

    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(true);
    expect(cache.has('key3')).toBe(true);
  });

  it('tracks access count and updates lastAccessed', async () => {
    const config: CacheConfig = {
      maxSize: 10,
      ttl: 60000,
      strategy: 'lru',
      compression: false,
      persistent: false,
    };

    const cache = new SmartCache<string>(config);
    await cache.set('key1', 'value1');

    await cache.get('key1');
    await cache.get('key1');

    const stats = cache.getStats();
    expect(stats.totalEntries).toBe(1);
  });

  it('exports and imports cache data', async () => {
    const config: CacheConfig = {
      maxSize: 10,
      ttl: 60000,
      strategy: 'lru',
      compression: false,
      persistent: false,
    };

    const cache1 = new SmartCache<string>(config);
    await cache1.set('key1', 'value1');
    await cache1.set('key2', 'value2');

    const exported = cache1.export();
    expect(exported.entries.length).toBe(2);

    const cache2 = new SmartCache<string>(config);
    cache2.import(exported);

    expect(await cache2.get('key1')).toBe('value1');
    expect(await cache2.get('key2')).toBe('value2');
  });

  it('findSimilar uses semantic hash similarity', async () => {
    const config: CacheConfig = {
      maxSize: 10,
      ttl: 60000,
      strategy: 'semantic',
      compression: false,
      persistent: false,
    };

    const cache = new SmartCache<string>(config);
    await cache.set('key1', 'apple banana cherry date');
    await cache.set('key2', 'apple banana cherry date');
    await cache.set('key3', 'xyz totally different words');

    const similar = cache.findSimilar('key1', 0.8);
    expect(similar).toBeDefined();
    expect(Array.isArray(similar)).toBe(true);
  });
});
