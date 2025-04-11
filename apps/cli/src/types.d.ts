declare module '@obsidian-magic/utils' {
  export function fileExists(path: string): Promise<boolean>;
  export function findFiles(dir: string, pattern: string): Promise<string[]>;
  export function readFile(path: string): Promise<string>;
  export function writeFile(path: string, content: string): Promise<void>;
  export function deleteFile(path: string): Promise<void>;
  export function ensureDir(path: string): Promise<void>;
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
    existingTags?: TagSet;
    metadata: Record<string, unknown>;
  }

  export class OpenAIClient {
    constructor(options: OpenAIClientOptions);
    setApiKey(apiKey: string): void;
    setModel(model: AIModel): void;
  }

  export class TaggingService {
    constructor(client: OpenAIClient, options: TaggingServiceOptions);
    tagDocument(document: Document): Promise<{
      success: boolean;
      tags?: TagSet;
      error?: {
        message: string;
        code: string;
        recoverable: boolean;
      };
    }>;
  }
}

declare module '@obsidian-magic/types' {
  export type TagSet = string[];
  export type TagBehavior = 'append' | 'replace' | 'merge';
  export type AIModel = 'gpt-3.5-turbo' | 'gpt-4o';
} 