declare module '@obsidian-magic/types' {
  export type TagSet = string[];
  export type TagBehavior = 'append' | 'replace' | 'merge';
  export type AIModel = 'gpt-4o' | 'gpt-3.5-turbo';
  export interface Document {
    id: string;
    path: string;
    content: string;
  }
  export interface TaggingOptions {
    model: AIModel;
    behavior: TagBehavior;
    minConfidence?: number;
    reviewThreshold?: number;
    generateExplanations?: boolean;
  }
  export interface TaggingResult {
    success: boolean;
    tags?: TagSet;
    error?: {
      message: string;
      code: string;
      recoverable: boolean;
    };
  }
}

declare module '@obsidian-magic/core' {
  import type { TagSet, TaggingOptions, TaggingResult, Document, AIModel } from '@obsidian-magic/types';

  export interface OpenAIClientOptions {
    apiKey: string;
    model: AIModel;
  }

  export class OpenAIClient {
    constructor(options: OpenAIClientOptions);
    setApiKey(apiKey: string): void;
    setModel(model: AIModel): void;
  }

  export class TaggingService {
    constructor(openAIClient: OpenAIClient, options: TaggingOptions);
    tagDocument(document: Document): Promise<TaggingResult>;
  }

  export interface DocumentProcessorOptions {
    preserveExistingTags: boolean;
    tagsKey: string;
    useNestedKeys: boolean;
  }

  export class DocumentProcessor {
    constructor(options: DocumentProcessorOptions);
    parseDocument(path: string, basename: string, content: string): Document;
    updateDocument(document: Document, tags: TagSet): string;
  }
} 