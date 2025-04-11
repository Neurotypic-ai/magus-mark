/**
 * Mock implementations of the core module
 */
import type { AIModel, TagBehavior } from '@obsidian-magic/types';

/**
 * OpenAI client options
 */
interface OpenAIClientOptions {
  apiKey: string;
  model: AIModel;
}

/**
 * Tagging service options
 */
interface TaggingServiceOptions {
  model: AIModel;
  behavior: TagBehavior;
  minConfidence?: number;
  reviewThreshold?: number;
}

/**
 * Document interface
 */
interface Document {
  id: string;
  path: string;
  content: string;
  existingTags?: string[];
  metadata: Record<string, unknown>;
}

/**
 * Mock OpenAI client
 */
export class OpenAIClient {
  private apiKey: string;
  private model: AIModel;

  constructor(options: OpenAIClientOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
  }

  /**
   * Set API key
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Set model
   */
  public setModel(model: AIModel): void {
    this.model = model;
  }

  /**
   * Complete a prompt
   */
  public complete(prompt: string): Promise<{ choices: { message: { content: string } }[] }> {
    // Mock implementation that uses the prompt parameter
    return Promise.resolve({
      choices: [
        {
          message: {
            content: `This is a mock response for prompt: ${prompt.substring(0, 20)}...`,
          },
        },
      ],
    });
  }
}

/**
 * Mock tagging service
 */
export class TaggingService {
  private client: OpenAIClient;
  private model: AIModel;
  private behavior: TagBehavior;
  private minConfidence: number;
  private reviewThreshold: number;

  constructor(client: OpenAIClient, options: TaggingServiceOptions) {
    this.client = client;
    this.model = options.model;
    this.behavior = options.behavior;
    this.minConfidence = options.minConfidence ?? 0.7;
    this.reviewThreshold = options.reviewThreshold ?? 0.5;
  }

  /**
   * Tag a document
   */
  public async tagDocument(document: Document): Promise<{
    success: boolean;
    tags?: string[];
    confidence?: number;
    error?: {
      message: string;
      code: string;
      recoverable: boolean;
    };
  }> {
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Generate mock tags based on content
      const content = document.content.toLowerCase();
      const tags: string[] = [];
      const confidence = Math.random() * 0.5 + 0.5; // Random between 0.5 and 1.0

      if (content.includes('typescript')) {
        tags.push('typescript', 'programming');
      }

      if (content.includes('react')) {
        tags.push('react', 'frontend');
      }

      if (content.includes('node')) {
        tags.push('node', 'javascript', 'backend');
      }

      if (content.includes('error') || content.includes('fix')) {
        tags.push('troubleshooting');
      }

      if (tags.length === 0) {
        tags.push('general', 'misc');
      }

      // Merge with existing tags if appropriate
      if (this.behavior === 'merge' && document.existingTags) {
        const allTags = new Set([...tags, ...document.existingTags]);
        return {
          success: true,
          tags: Array.from(allTags),
          confidence,
        };
      }

      // Return generated tags
      return {
        success: true,
        tags,
        confidence,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: 'TAGGING_ERROR',
          recoverable: true,
        },
      };
    }
  }
}

/**
 * Domain info type
 */
interface DomainInfo {
  tags: string[];
  description?: string;
}

/**
 * Mock taxonomy module
 */
export const taxonomy = {
  domains: new Map<string, DomainInfo>([
    ['programming', { tags: ['typescript', 'javascript', 'python', 'rust', 'golang'] }],
    ['frontend', { tags: ['react', 'vue', 'angular', 'svelte'] }],
    ['backend', { tags: ['node', 'express', 'django', 'flask'] }],
    ['ai', { tags: ['machine-learning', 'deep-learning', 'nlp', 'computer-vision'] }],
  ]),

  /**
   * Get all domains
   */
  getDomains(): string[] {
    return Array.from(this.domains.keys());
  },

  /**
   * Get tags for a domain
   */
  getTagsForDomain(domain: string): string[] {
    const domainInfo = this.domains.get(domain);
    return domainInfo ? domainInfo.tags : [];
  },

  /**
   * Create a new domain
   */
  createDomain(domain: string, description?: string): boolean {
    if (this.domains.has(domain)) {
      return false;
    }
    this.domains.set(domain, { tags: [], description });
    return true;
  },

  /**
   * Delete a domain
   */
  deleteDomain(domain: string): boolean {
    return this.domains.delete(domain);
  },
};

/**
 * Mock batch processor
 */
export const batchProcessor = {
  /**
   * Process a batch of documents
   */
  async processBatch(
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
      error?: Error;
    }[];
    stats: {
      total: number;
      succeeded: number;
      failed: number;
      totalTokens: number;
      cost: number;
    };
  }> {
    const results: {
      documentId: string;
      success: boolean;
      tags?: string[];
      error?: Error;
    }[] = [];
    let succeeded = 0;
    let failed = 0;
    let totalTokens = 0;

    // Process each document (safely)
    for (let i = 0; i < documents.length; i++) {
      // Make sure document exists
      const doc = documents[i];
      if (!doc) {
        failed++;
        results.push({
          documentId: `unknown-${String(i)}`,
          success: false,
          error: new Error('Document is undefined'),
        });
        continue;
      }

      try {
        // Process document
        const result = await options.taggingService.tagDocument(doc);

        // Calculate tokens (mock)
        const docTokens = Math.ceil(doc.content.length / 4);
        totalTokens += docTokens;

        if (result.success && result.tags) {
          succeeded++;
          results.push({
            documentId: doc.id,
            success: true,
            tags: result.tags,
          });
        } else {
          failed++;
          results.push({
            documentId: doc.id,
            success: false,
            error:
              result.error instanceof Error
                ? result.error
                : new Error(typeof result.error === 'string' ? result.error : 'Unknown error'),
          });
        }
      } catch (error) {
        // Handle unexpected errors
        failed++;
        results.push({
          documentId: doc.id,
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }

      // Report progress if callback provided
      if (options.onProgress) {
        options.onProgress((i + 1) / documents.length);
      }
    }

    // Calculate cost (mock)
    const cost = totalTokens * 0.0000015;

    return {
      results,
      stats: {
        total: documents.length,
        succeeded,
        failed,
        totalTokens,
        cost,
      },
    };
  },
};
