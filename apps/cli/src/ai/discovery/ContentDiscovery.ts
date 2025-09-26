import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { EventEmitter } from 'events';
import { extname } from 'path';

import { Logger } from '@magus-mark/core/utils/Logger';

export interface DiscoveryConfig {
  patterns: string[];
  excludePatterns: string[];
  maxDepth: number;
  followSymlinks: boolean;
  includeHidden: boolean;
}

export interface DiscoveredContent {
  path: string;
  type: 'file' | 'directory';
  size: number;
  lastModified: Date;
  metadata?: Record<string, unknown>;
  contentPreview?: string;
}

export interface DiscoveryResult {
  totalFound: number;
  files: DiscoveredContent[];
  directories: DiscoveredContent[];
  errors: string[];
  duration: number;
}

export class ContentDiscovery extends EventEmitter {
  private config: DiscoveryConfig;
  private logger: Logger;

  constructor(config: DiscoveryConfig) {
    super();
    this.config = config;
    this.logger = Logger.getInstance('content-discovery');
  }

  async discover(rootPath: string): Promise<DiscoveryResult> {
    const startTime = Date.now();
    const result: DiscoveryResult = {
      totalFound: 0,
      files: [],
      directories: [],
      errors: [],
      duration: 0,
    };

    this.logger.info(`Starting content discovery in ${rootPath}`);
    this.emit('discovery:started', rootPath);

    try {
      await this.scanDirectory(rootPath, 0, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      this.logger.error(`Discovery failed: ${errorMessage}`);
    }

    result.duration = Date.now() - startTime;
    result.totalFound = result.files.length + result.directories.length;

    this.logger.info(
      `Discovery completed. Found ${result.totalFound.toString()} items in ${result.duration.toString()}ms`
    );
    this.emit('discovery:completed', result);

    return result;
  }

  private async scanDirectory(dirPath: string, depth: number, result: DiscoveryResult): Promise<void> {
    if (depth > this.config.maxDepth) {
      return;
    }

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip hidden files if not included
        if (!this.config.includeHidden && entry.name.startsWith('.')) {
          continue;
        }

        // Check exclude patterns
        if (this.isExcluded(fullPath)) {
          continue;
        }

        try {
          const stats = await fs.stat(fullPath);
          const discoveredItem: DiscoveredContent = {
            path: fullPath,
            type: entry.isFile() ? 'file' : 'directory',
            size: stats.size,
            lastModified: stats.mtime,
          };

          if (entry.isFile()) {
            // Add content preview for text files
            if (this.isTextFile(fullPath)) {
              discoveredItem.contentPreview = await this.getContentPreview(fullPath);
            }
            result.files.push(discoveredItem);
          } else if (entry.isDirectory()) {
            result.directories.push(discoveredItem);

            // Recursively scan subdirectory
            await this.scanDirectory(fullPath, depth + 1, result);
          }

          this.emit('discovery:item', discoveredItem);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errors.push(`Error processing ${fullPath}: ${errorMessage}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Error scanning directory ${dirPath}: ${errorMessage}`);
    }
  }

  private isExcluded(filePath: string): boolean {
    return this.config.excludePatterns.some((pattern) => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    });
  }

  private isTextFile(filePath: string): boolean {
    const textExtensions = ['.md', '.txt', '.json', '.yaml', '.yml', '.js', '.ts', '.jsx', '.tsx'];
    const ext = extname(filePath).toLowerCase();
    return textExtensions.includes(ext);
  }

  private async getContentPreview(filePath: string, maxLength = 200): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    } catch {
      return '[Unable to read content]';
    }
  }
}
