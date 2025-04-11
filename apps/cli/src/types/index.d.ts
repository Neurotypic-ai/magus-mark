declare module '@obsidian-magic/types' {
  export type TagSet = string[];
  export type TagBehavior = 'append' | 'replace' | 'merge';
  export type AIModel = 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4o';
}

declare module '@obsidian-magic/utils' {
  export function fileExists(path: string): Promise<boolean>;
  export function findFiles(dir: string, pattern: string): Promise<string[]>;
  export function readFile(path: string): Promise<string>;
  export function writeFile(path: string, content: string): Promise<void>;
  export function deleteFile(path: string): Promise<void>;
  export function ensureDir(path: string): Promise<void>;
  export function formatCurrency(amount: number): string;
  export function formatDuration(ms: number): string;
  export function calculateTokens(text: string): number;
  export function getFileSize(filePath: string): string;
  export function formatPath(filePath: string): string;
  export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
  export function executeCommand(command: string): Promise<{ stdout: string; stderr: string }>;
}

declare module '@obsidian-magic/core' {
  import type { AIModel, TagBehavior, TagSet } from '@obsidian-magic/types';

  export interface OpenAIClientOptions {
    apiKey: string;
    model: AIModel;
  }

  export interface TaggingServiceOptions {
    model: AIModel;
    behavior: TagBehavior;
    minConfidence?: number;
    reviewThreshold?: number;
  }

  export interface Document {
    id: string;
    path: string;
    content: string;
    existingTags?: string[];
    metadata: Record<string, unknown>;
  }

  export class OpenAIClient {
    constructor(options: OpenAIClientOptions);
    setApiKey(apiKey: string): void;
    setModel(model: AIModel): void;
    complete(prompt: string): Promise<any>;
  }

  export class TaggingService {
    constructor(client: OpenAIClient, options: TaggingServiceOptions);
    tagDocument(document: Document): Promise<{
      success: boolean;
      tags?: string[];
      confidence?: number;
      error?: {
        message: string;
        code: string;
        recoverable: boolean;
      };
    }>;
  }

  export const taxonomy: {
    getDomains(): string[];
    getTagsForDomain(domain: string): string[];
    createDomain(domain: string, description?: string): boolean;
    deleteDomain(domain: string): boolean;
  };

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
        tags?: string[];
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