import { vi } from 'vitest';

import { Events } from './MockEvents';

import type {
  CachedMetadata as CachedMetadataType,
  MetadataCache as MetadataCacheType,
  TFile,
  TagCache as TagCacheType,
} from 'obsidian';
import type { Mock } from 'vitest';

/**
 * Minimal MetadataCache stub with getFileCache returning a valid mock cache for any TFile.
 * @example
 *   const cache = new MetadataCache();
 *   const fileCache = cache.getFileCache(file);
 */

export class MetadataCache extends Events implements MetadataCacheType {
  resolvedLinks: Record<string, Record<string, number>> = {};
  unresolvedLinks: Record<string, Record<string, number>> = {};

  /**
   * Returns a mock file cache object for any TFile.
   * Override in tests if you need custom cache data.
   */
  getFileCache: Mock<(file?: TFile) => CachedMetadataType | null> = vi.fn((file?: TFile) => {
    console.log('getFileCache', file);
    return {
      frontmatter: { tags: ['test-tag'] },
      tags: [
        {
          tag: '#inline-tag',
          position: { start: { line: 5 } },
        } as unknown as TagCacheType,
      ],
      // Add other properties as needed or return null
    };
  });
  getCache: Mock<(path: string) => CachedMetadataType | null> = vi.fn((path: string) => {
    console.log('getCache', path);
    return null; // Or return mock cache
  });
  fileToLinktext: Mock<(file: TFile) => string> = vi.fn((file: TFile) => file.name);
  getFirstLinkpathDest: Mock<(linkpath: string, sourcePath: string) => TFile | null> = vi.fn(
    (linkpath: string, sourcePath: string) => {
      console.log('getFirstLinkpathDest', linkpath, sourcePath);
      return null; // Basic stub
    }
  );
}
