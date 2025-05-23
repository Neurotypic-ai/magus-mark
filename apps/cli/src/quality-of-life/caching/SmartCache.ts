import { createHash } from 'crypto';
import { EventEmitter } from 'events';

export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  strategy: 'lru' | 'semantic' | 'content-aware';
  compression: boolean;
  persistent: boolean;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  semanticHash?: string;
  contentHash: string;
  size: number;
}

export class SmartCache<T> extends EventEmitter {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private accessOrder: string[] = [];
  private totalSize = 0;

  constructor(config: CacheConfig) {
    super();
    this.config = config;
    this.startCleanupTimer();
  }

  async set(key: string, value: T, metadata?: any): Promise<void> {
    const contentHash = this.generateContentHash(value);
    const semanticHash = await this.generateSemanticHash(value, metadata);

    // Check for semantic duplicates
    if (this.config.strategy === 'semantic' && semanticHash) {
      const existing = this.findBySemanticHash(semanticHash);
      if (existing) {
        this.emit('cache:duplicate', key, existing.key);
        return;
      }
    }

    const processedValue = this.config.compression ? await this.compress(value) : value;
    const size = this.estimateSize(processedValue);

    const entry: CacheEntry<T> = {
      key,
      value: processedValue,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      semanticHash,
      contentHash,
      size,
    };

    // Remove existing entry if updating
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.totalSize -= oldEntry.size;
    }

    this.cache.set(key, entry);
    this.totalSize += size;
    this.updateAccessOrder(key);

    // Enforce size limits
    while (this.shouldEvict()) {
      await this.evict();
    }

    this.emit('cache:set', key, entry);
  }

  async get(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.emit('cache:miss', key);
      return undefined;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.delete(key);
      this.emit('cache:expired', key);
      return undefined;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);

    this.emit('cache:hit', key);

    const value = this.config.compression ? await this.decompress(entry.value) : entry.value;

    return value;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.totalSize -= entry.size;

    // Remove from access order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    this.emit('cache:deleted', key);
    return true;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.totalSize = 0;
    this.emit('cache:cleared');
  }

  private generateContentHash(value: T): string {
    const content = typeof value === 'string' ? value : JSON.stringify(value);
    return createHash('sha256').update(content).digest('hex');
  }

  private async generateSemanticHash(value: T, metadata?: any): Promise<string | undefined> {
    if (this.config.strategy !== 'semantic') return undefined;

    // Use AI embeddings or content analysis for semantic similarity
    // This is a placeholder for actual semantic analysis
    // In a real implementation, this would:
    // 1. Extract text content from the value
    // 2. Generate embeddings using an AI model
    // 3. Create a hash based on semantic similarity clusters

    const content = typeof value === 'string' ? value : JSON.stringify(value);
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const sortedWords = words.sort().join('');

    return createHash('md5').update(sortedWords).digest('hex').substring(0, 16);
  }

  private findBySemanticHash(hash: string): CacheEntry<T> | undefined {
    for (const entry of this.cache.values()) {
      if (entry.semanticHash === hash) {
        return entry;
      }
    }
    return undefined;
  }

  private shouldEvict(): boolean {
    return this.cache.size > this.config.maxSize || this.totalSize > this.getMaxSizeBytes();
  }

  private getMaxSizeBytes(): number {
    // Default to 100MB if not specified
    return this.config.maxSize * 1024 * 1024; // Convert MB to bytes
  }

  private async evict(): Promise<void> {
    switch (this.config.strategy) {
      case 'lru':
        await this.evictLRU();
        break;
      case 'semantic':
        await this.evictSemantic();
        break;
      case 'content-aware':
        await this.evictContentAware();
        break;
    }
  }

  private async evictLRU(): Promise<void> {
    if (this.accessOrder.length === 0) return;

    const oldestKey = this.accessOrder[0];
    this.delete(oldestKey);

    this.emit('cache:evicted', oldestKey, 'lru');
  }

  private async evictSemantic(): Promise<void> {
    // Find entries with similar semantic hashes and evict the older ones
    const semanticGroups = new Map<string, CacheEntry<T>[]>();

    for (const entry of this.cache.values()) {
      if (entry.semanticHash) {
        if (!semanticGroups.has(entry.semanticHash)) {
          semanticGroups.set(entry.semanticHash, []);
        }
        semanticGroups.get(entry.semanticHash)!.push(entry);
      }
    }

    // Find groups with multiple entries and evict older ones
    for (const [hash, entries] of semanticGroups) {
      if (entries.length > 1) {
        // Sort by last accessed (oldest first)
        entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

        // Evict all but the most recently accessed
        for (let i = 0; i < entries.length - 1; i++) {
          this.delete(entries[i].key);
          this.emit('cache:evicted', entries[i].key, 'semantic');
          return; // Only evict one at a time
        }
      }
    }

    // If no semantic duplicates found, fall back to LRU
    await this.evictLRU();
  }

  private async evictContentAware(): Promise<void> {
    // Analyze content characteristics and evict based on:
    // 1. Size (large items first)
    // 2. Access frequency (low frequency first)
    // 3. Age (old items first)

    const entries = Array.from(this.cache.values());

    // Score each entry (lower score = higher priority for eviction)
    const scoredEntries = entries.map((entry) => {
      const ageScore = (Date.now() - entry.timestamp) / this.config.ttl; // 0-1+
      const frequencyScore = 1 / (entry.accessCount + 1); // Lower frequency = higher score
      const sizeScore = entry.size / this.getMaxSizeBytes(); // Larger size = higher score

      const totalScore = ageScore * 0.3 + frequencyScore * 0.4 + sizeScore * 0.3;

      return { entry, score: totalScore };
    });

    // Sort by score (highest score = first to evict)
    scoredEntries.sort((a, b) => b.score - a.score);

    if (scoredEntries.length > 0) {
      const toEvict = scoredEntries[0].entry;
      this.delete(toEvict.key);
      this.emit('cache:evicted', toEvict.key, 'content-aware');
    }
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private async compress(value: T): Promise<any> {
    // Placeholder for compression logic
    // In a real implementation, this would use a compression library like zlib
    const content = typeof value === 'string' ? value : JSON.stringify(value);

    // Simple compression simulation - in reality, use actual compression
    return {
      compressed: true,
      data: content,
      originalSize: content.length,
    };
  }

  private async decompress(value: any): Promise<T> {
    // Placeholder for decompression logic
    if (value?.compressed) {
      return value.data as T;
    }
    return value as T;
  }

  private estimateSize(value: any): number {
    if (typeof value === 'string') {
      return value.length * 2; // Rough estimate for UTF-16
    }

    return JSON.stringify(value).length * 2;
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Cleanup every minute
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.delete(key);
      this.emit('cache:expired', key);
    });
  }

  getStats(): CacheStats {
    const now = Date.now();
    let hits = 0;
    let totalAccesses = 0;

    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
      if (entry.accessCount > 0) hits++;
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: totalAccesses > 0 ? hits / totalAccesses : 0,
      totalEntries: this.cache.size,
      oldestEntry: this.getOldestEntry(),
      memoryUsage: this.totalSize,
      strategy: this.config.strategy,
      ttl: this.config.ttl,
      totalAccesses,
    };
  }

  private getOldestEntry(): number {
    let oldest = Date.now();
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
    }
    return oldest;
  }

  // Advanced cache operations
  findSimilar(key: string, threshold = 0.8): string[] {
    const entry = this.cache.get(key);
    if (!entry?.semanticHash) return [];

    const similar: string[] = [];

    for (const [otherKey, otherEntry] of this.cache.entries()) {
      if (otherKey === key || !otherEntry.semanticHash) continue;

      // Simple similarity check - in a real implementation, use actual semantic similarity
      const similarity = this.calculateSimilarity(entry.semanticHash, otherEntry.semanticHash);
      if (similarity >= threshold) {
        similar.push(otherKey);
      }
    }

    return similar;
  }

  private calculateSimilarity(hash1: string, hash2: string): number {
    // Simple Hamming distance for demonstration
    // In a real implementation, use proper semantic similarity metrics
    let differences = 0;
    const maxLength = Math.max(hash1.length, hash2.length);

    for (let i = 0; i < maxLength; i++) {
      if (hash1[i] !== hash2[i]) differences++;
    }

    return 1 - differences / maxLength;
  }

  preload(keys: string[]): Promise<void[]> {
    // Preload cache with predicted keys
    return Promise.all(keys.map((key) => this.get(key).then(() => {})));
  }

  export(): CacheExport<T> {
    const entries: [string, CacheEntry<T>][] = [];

    for (const [key, entry] of this.cache.entries()) {
      entries.push([key, entry]);
    }

    return {
      config: { ...this.config },
      entries,
      stats: this.getStats(),
      exportTimestamp: Date.now(),
    };
  }

  import(data: CacheExport<T>): void {
    this.clear();
    this.config = { ...data.config };

    for (const [key, entry] of data.entries) {
      this.cache.set(key, entry);
      this.totalSize += entry.size;
      this.updateAccessOrder(key);
    }

    this.emit('cache:imported', data.entries.length);
  }
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  totalEntries: number;
  oldestEntry: number;
  memoryUsage: number;
  strategy: string;
  ttl: number;
  totalAccesses: number;
}

export interface CacheExport<T> {
  config: CacheConfig;
  entries: [string, CacheEntry<T>][];
  stats: CacheStats;
  exportTimestamp: number;
}
