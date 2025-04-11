/**
 * TypeScript declarations for CLI-specific types
 */

// No need to redeclare types that are already defined in @obsidian-magic/types
// Remove any duplicate type definitions and use proper imports/references

/**
 * CLI-specific utility declarations
 */
declare module '@obsidian-magic/utils' {
  // File system utilities
  export function fileExists(path: string): Promise<boolean>;
  export function findFiles(dir: string, pattern: string): Promise<string[]>;
  export function readFile(path: string): Promise<string>;
  export function writeFile(path: string, content: string): Promise<void>;
  export function deleteFile(path: string): Promise<void>;
  export function ensureDir(path: string): Promise<void>;

  // Formatting utilities
  export function formatCurrency(amount: number): string;
  export function formatDuration(ms: number): string;
  export function calculateTokens(text: string): number;
  export function getFileSize(filePath: string): string;
  export function formatPath(filePath: string): string;

  // Data utilities
  export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
  export function executeCommand(command: string): Promise<{ stdout: string; stderr: string }>;
}

/**
 * CLI-specific core module declarations
 */
declare module '@obsidian-magic/core' {
  import type { AIModel, TagBehavior, TagSet } from '@obsidian-magic/types';

  // Extended options for CLI usage
  export interface OpenAIClientOptions {
    apiKey: string;
    model: AIModel;
    organization?: string;
    maxRetries?: number;
  }

  // CLI configuration for tagging
  export interface TaggingServiceOptions {
    model: AIModel;
    behavior: TagBehavior;
    minConfidence?: number;
    reviewThreshold?: number;
  }

  // Batch processing utilities for CLI
  export const batchProcessor: {
    processBatch(
      documents: Document[],
      options: {
        concurrency: number;
        minConfidence: number;
        taggingService: TaggingService;
        onProgress?: (progress: number) => void;
      }
    ): Promise<{
      results: {
        documentId: string;
        success: boolean;
        tags?: TagSet;
        error?: any;
      }[];
      stats: {
        total: number;
        succeeded: number;
        failed: number;
        totalTokens: number;
        cost: number;
      };
    }>;
  };
}
