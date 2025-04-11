import type { AIModel, TagBehavior, TagSet } from '@obsidian-magic/types';

/**
 * Mock OpenAIClient
 */
export class OpenAIClient {
  private apiKey: string;
  private model: AIModel;

  constructor(options: { apiKey: string; model: AIModel }) {
    this.apiKey = options.apiKey;
    this.model = options.model;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  setModel(model: AIModel): void {
    this.model = model;
  }

  /**
   * Mock completion for testing
   */
  async complete(prompt: string): Promise<any> {
    // Use this.model and this.apiKey to suppress unused variable warnings
    console.debug(`Using model ${this.model} with key ${this.apiKey.substring(0, 3)}...`);
    
    return {
      choices: [
        {
          message: {
            content: JSON.stringify({
              tags: ['mock-tag-1', 'mock-tag-2'],
              confidence: 0.85
            })
          }
        }
      ],
      usage: {
        prompt_tokens: prompt.length / 4,
        completion_tokens: 50,
        total_tokens: prompt.length / 4 + 50
      }
    };
  }
}

/**
 * Mock Document interface
 */
export interface Document {
  id: string;
  path: string;
  content: string;
  existingTags?: string[];
  metadata: Record<string, unknown>;
}

/**
 * Mock TaggingService
 */
export class TaggingService {
  private client: OpenAIClient;
  private options: {
    model: AIModel;
    behavior: TagBehavior;
    minConfidence?: number;
    reviewThreshold?: number;
  };

  constructor(
    client: OpenAIClient,
    options: {
      model: AIModel;
      behavior: TagBehavior;
      minConfidence?: number;
      reviewThreshold?: number;
    }
  ) {
    this.client = client;
    this.options = options;
  }

  /**
   * Mock document tagging implementation
   */
  async tagDocument(document: Document): Promise<{
    success: boolean;
    tags?: string[];
    confidence?: number;
    error?: {
      message: string;
      code: string;
      recoverable: boolean;
    };
  }> {
    // Use this.client and this.options to suppress unused variable warnings
    const model = this.options.model;
    
    // Mock delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get mock response from client
    try {
      // Simulate client call
      await this.client.complete(`Tagging document ${document.id} using ${model}`);
      
      // Randomly fail 10% of the time to test error handling
      if (Math.random() < 0.1) {
        return {
          success: false,
          error: {
            message: 'Mock API error',
            code: 'mock_api_error',
            recoverable: true
          }
        };
      }
      
      // Return mock tags
      return {
        success: true,
        tags: ['ai', 'conversation', 'mock-tag', document.path.split('/').pop()?.split('.')[0] || 'unknown'],
        confidence: 0.85
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: `Mock error: ${String(error)}`,
          code: 'mock_error',
          recoverable: false
        }
      };
    }
  }
}

/**
 * Mock taxonomy methods
 */
export const taxonomy = {
  /**
   * Get all domains
   */
  getDomains(): string[] {
    return ['programming', 'design', 'business', 'science', 'arts'];
  },
  
  /**
   * Get tags for a domain
   */
  getTagsForDomain(domain: string): string[] {
    const tagMap: Record<string, string[]> = {
      programming: ['javascript', 'typescript', 'python', 'react', 'node'],
      design: ['ui', 'ux', 'graphic-design', 'typography'],
      business: ['strategy', 'marketing', 'finance', 'operations'],
      science: ['physics', 'biology', 'chemistry', 'mathematics'],
      arts: ['visual', 'music', 'literature', 'performing']
    };
    
    return tagMap[domain] || [];
  },
  
  /**
   * Create a new domain
   */
  createDomain(domain: string, description?: string): boolean {
    return true;
  },
  
  /**
   * Delete a domain
   */
  deleteDomain(domain: string): boolean {
    return true;
  }
};

/**
 * Mock batch processing
 */
export const batchProcessor = {
  /**
   * Process documents in batch
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
    results: Array<{
      documentId: string;
      success: boolean;
      tags?: string[] | undefined;
      error?: any;
    }>;
    stats: {
      total: number;
      succeeded: number;
      failed: number;
      totalTokens: number;
      cost: number;
    };
  }> {
    const results = [];
    let succeeded = 0;
    let failed = 0;
    let totalTokens = 0;
    
    for (const doc of documents) {
      // Simulate progress
      if (options.onProgress) {
        options.onProgress((documents.indexOf(doc) / documents.length) * 100);
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get tagging result
      const result = await options.taggingService.tagDocument(doc);
      
      // Add to results
      results.push({
        documentId: doc.id,
        success: result.success,
        tags: result.tags,
        error: result.error
      });
      
      // Update stats
      if (result.success) {
        succeeded++;
        totalTokens += doc.content.length / 4 + 50; // Approximate token count
      } else {
        failed++;
      }
    }
    
    // Call progress one last time to show 100%
    if (options.onProgress) {
      options.onProgress(100);
    }
    
    return {
      results,
      stats: {
        total: documents.length,
        succeeded,
        failed,
        totalTokens,
        cost: totalTokens * 0.000002 // Mock cost calculation
      }
    };
  }
}; 