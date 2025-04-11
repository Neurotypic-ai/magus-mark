/**
 * OpenAI integration module
 */
import OpenAI from 'openai';
import { encoding_for_model } from 'tiktoken';

import { APIError, ErrorCodes, normalizeError } from './errors';

import type { AIModel } from '@obsidian-magic/types';

/**
 * OpenAI API Client configuration
 */
export interface OpenAIConfig {
  apiKey: string;
  model: AIModel;
  maxRetries: number;
  initialRetryDelay: number;
  maxRetryDelay: number;
  backoffFactor: number;
  timeout: number;
  enableModeration?: boolean;
}

/**
 * Default OpenAI configuration
 */
export const DEFAULT_OPENAI_CONFIG: OpenAIConfig = {
  apiKey: '',
  model: 'gpt-4o',
  maxRetries: 3,
  initialRetryDelay: 1000,
  maxRetryDelay: 60000,
  backoffFactor: 2,
  timeout: 30000,
  enableModeration: false,
};

/**
 * Response from OpenAI API
 */
export interface OpenAIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    retryAfter?: number | undefined;
    statusCode?: number | undefined;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

/**
 * Moderation result from OpenAI API
 */
export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
  flaggedCategories: string[];
}

/**
 * OpenAI API client for making requests with retry logic and error handling
 */
export class OpenAIClient {
  private config: OpenAIConfig;
  private client: OpenAI | null = null;
  private encodingCache: Record<string, ReturnType<typeof encoding_for_model>> = {};

  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = { ...DEFAULT_OPENAI_CONFIG, ...config };
    if (this.config.apiKey) {
      this.initClient();
    }
  }

  /**
   * Initialize the OpenAI client
   */
  private initClient(): void {
    if (!this.config.apiKey) {
      throw new APIError('API key is required to initialize the OpenAI client', {
        code: ErrorCodes.MISSING_API_KEY,
        recoverable: false,
      });
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
    });
  }

  /**
   * Set API key for the client
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.initClient();
  }

  /**
   * Set the AI model to use
   */
  setModel(model: AIModel): void {
    this.config.model = model;
  }

  /**
   * Make a request to the OpenAI API with built-in retry logic
   */
  async makeRequest<T>(
    prompt: string,
    systemMessage: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      functions?: Record<string, unknown>[];
    } = {}
  ): Promise<OpenAIResponse<T>> {
    if (!this.client) {
      return {
        success: false,
        error: {
          message: 'OpenAI client is not initialized. Please set a valid API key.',
          code: ErrorCodes.MISSING_API_KEY,
        },
      };
    }

    // Check content for policy violations if moderation is enabled
    if (this.config.enableModeration) {
      try {
        const moderationResult = await this.moderateContent(prompt);
        if (moderationResult.flagged) {
          return {
            success: false,
            error: {
              message: `Content violates OpenAI policy. Flagged categories: ${moderationResult.flaggedCategories.join(', ')}`,
              code: 'CONTENT_POLICY_VIOLATION',
            },
          };
        }
      } catch (error) {
        console.warn('Failed to moderate content:', error);
        // Continue with the request even if moderation fails
      }
    }

    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 1000;
    const model = this.config.model;
    const promptTokens = this.estimateTokenCount(prompt) + this.estimateTokenCount(systemMessage);

    let attemptCount = 0;
    const maxAttempts = this.config.maxRetries + 1;

    while (attemptCount < maxAttempts) {
      attemptCount++;

      try {
        const requestOptions: OpenAI.Chat.ChatCompletionCreateParams = {
          model,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        };

        // Only add tools if functions are provided
        if (options.functions && options.functions.length > 0) {
          requestOptions.tools = options.functions.map((func) => ({
            type: 'function' as const,
            function: {
              name: func['name'] as string,
              description: func['description'] as string,
              parameters: func['parameters'] as Record<string, unknown>,
            },
          }));
        }

        const response = await this.client.chat.completions.create(requestOptions);

        const completionTokens = response.usage?.completion_tokens ?? 0;
        const totalTokens = response.usage?.total_tokens ?? 0;

        // Calculate estimated cost based on model
        let costPerToken = 0.00001; // Default for gpt-3.5-turbo
        if (model.includes('gpt-4')) {
          costPerToken = model.includes('32k') ? 0.00006 : 0.00003;
        } else if (model.includes('gpt-4o')) {
          costPerToken = 0.00001;
        }

        let responseText = response.choices[0]?.message.content ?? '';
        let parsedData: T;

        try {
          // Try to parse the response as JSON if it looks like JSON
          if (responseText && responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
            parsedData = JSON.parse(responseText) as T;
          } else {
            // Otherwise treat it as a regular text response
            parsedData = responseText as unknown as T;
          }

          return {
            success: true,
            data: parsedData,
            usage: {
              promptTokens,
              completionTokens,
              totalTokens,
              estimatedCost: totalTokens * costPerToken,
            },
          };
        } catch (_) {
          void _; // Mark as intentionally unused
          // If parsing fails, return the raw text
          return {
            success: true,
            data: responseText as unknown as T,
            usage: {
              promptTokens,
              completionTokens,
              totalTokens,
              estimatedCost: totalTokens * costPerToken,
            },
          };
        }
      } catch (error) {
        const err = error as Error & { status?: number; headers?: Headers };

        // Check if it's a rate limit error
        if (err.status === 429) {
          const retryAfterHeader = err.headers?.get('retry-after');
          const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

          if (attemptCount < maxAttempts) {
            const backoffTime = this.calculateBackoff(attemptCount, retryAfter);
            await new Promise((resolve) => setTimeout(resolve, backoffTime));
            continue;
          }
        }

        // Check if it's a server error (5xx)
        if (err.status && err.status >= 500 && err.status < 600) {
          if (attemptCount < maxAttempts) {
            const backoffTime = this.calculateBackoff(attemptCount);
            await new Promise((resolve) => setTimeout(resolve, backoffTime));
            continue;
          }
        }

        // If we've reached maximum retries or it's another type of error, return the error
        const retryAfterHeader = err.headers?.get('retry-after');
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

        return {
          success: false,
          error: {
            message: err.message || 'Unknown error occurred during API request',
            code:
              err.status === 429
                ? ErrorCodes.RATE_LIMIT_EXCEEDED
                : err.status && err.status >= 500
                  ? ErrorCodes.SERVER_ERROR
                  : ErrorCodes.API_ERROR,
            retryAfter,
            statusCode: err.status,
          },
        };
      }
    }

    // If we've exhausted all retries
    return {
      success: false,
      error: {
        message: 'Maximum retry attempts reached',
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      },
    };
  }

  /**
   * Check text content against OpenAI's moderation endpoint
   */
  async moderateContent(text: string): Promise<ModerationResult> {
    if (!this.client) {
      throw new APIError('OpenAI client is not initialized. Please set a valid API key.', {
        code: ErrorCodes.MISSING_API_KEY,
        recoverable: false,
      });
    }

    try {
      const response = await this.client.moderations.create({ input: text });
      const result = response.results[0];

      if (!result) {
        throw new APIError('Moderation API returned no results', {
          code: ErrorCodes.API_ERROR,
          recoverable: true,
        });
      }

      // Extract flagged categories for easier access
      const flaggedCategories = Object.entries(result.categories)
        .filter(([, isFlagged]) => isFlagged)
        .map(([category]) => category);

      return {
        flagged: result.flagged,
        categories: result.categories as unknown as Record<string, boolean>,
        categoryScores: result.category_scores as unknown as Record<string, number>,
        flaggedCategories,
      };
    } catch (error) {
      const normalizedError = normalizeError(error);
      throw new APIError(`Moderation API error: ${normalizedError.message}`, {
        code: ErrorCodes.API_ERROR,
        recoverable: true,
        statusCode: (error as Error & { status?: number }).status,
      });
    }
  }

  /**
   * Calculate token usage for a request
   */
  calculateTokenUsage(
    prompt: string,
    systemMessage: string,
    responseTokens = 0
  ): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    const promptTokens = this.estimateTokenCount(prompt) + this.estimateTokenCount(systemMessage);
    return {
      promptTokens,
      completionTokens: responseTokens,
      totalTokens: promptTokens + responseTokens,
    };
  }

  /**
   * Helper method for calculating exponential backoff time
   */
  private calculateBackoff(attemptNumber: number, retryAfter?: number): number {
    if (retryAfter) {
      return Math.min(retryAfter * 1000, this.config.maxRetryDelay);
    }

    const delay = Math.min(
      this.config.initialRetryDelay * Math.pow(this.config.backoffFactor, attemptNumber - 1),
      this.config.maxRetryDelay
    );

    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return delay + jitter;
  }

  /**
   * Estimate token count for a string
   */
  estimateTokenCount(text: string): number {
    try {
      // Use tiktoken for accurate token counting
      const modelName = this.config.model.includes('gpt-4')
        ? 'gpt-4'
        : this.config.model.includes('gpt-3.5')
          ? 'gpt-3.5-turbo'
          : 'gpt-4o';

      this.encodingCache[modelName] ??= encoding_for_model(modelName);
      return this.encodingCache[modelName].encode(text).length;
    } catch (_) {
      void _; // Mark as intentionally unused
      // Fallback to approximate count if tiktoken fails
      return Math.ceil(text.length / 4);
    }
  }
}

/**
 * Prompt engineering utilities for constructing effective prompts
 */
export const PromptEngineering = {
  /**
   * Create a structured tagging prompt
   */
  createTaggingPrompt(
    content: string,
    taxonomy: Record<string, unknown>,
    options: {
      includeExamples?: boolean;
      maxLength?: number;
    } = {}
  ): string {
    const { includeExamples = true, maxLength } = options;

    // Truncate content if needed
    const processedContent =
      maxLength && content.length > maxLength ? `${content.substring(0, maxLength)}... (content truncated)` : content;

    // Construct the prompt
    let prompt = `
<conversation>
${processedContent}
</conversation>

<instructions>
Analyze the conversation above and classify it according to the taxonomies below.
You must classify this conversation using ONLY the approved tags listed below.
</instructions>

<taxonomy>
${JSON.stringify(taxonomy, null, 2)}
</taxonomy>
`;

    // Add examples if requested
    if (includeExamples) {
      prompt += `
<examples>
${this.getTaggingExamples()}
</examples>
`;
    }

    // Add response format instructions
    prompt += `
<response_format>
Provide your classification as a valid JSON object with the following structure:
{
  "year": "YYYY",
  "life_area": "area_name",
  "topical_tags": [
    {"domain": "domain_name", "subdomain": "subdomain_name"},
    {"contextual": "contextual_tag"}
  ],
  "conversation_type": "type_name",
  "confidence": {
    "overall": 0.95,
    "life_area": 0.87,
    "domain": 0.92,
    "conversation_type": 0.94
  }
}
</response_format>
`;

    return prompt;
  },

  /**
   * Get examples for few-shot learning
   */
  getTaggingExamples(): string {
    return `
Example 1:
<conversation>
User: I need help optimizing my React application. It's becoming slow when rendering large lists.
Assistant: There are several ways to optimize React's rendering performance. First, consider using virtualization with libraries like react-window or react-virtualized. These render only visible items, reducing DOM nodes. Second, implement React.memo or shouldComponentUpdate to prevent unnecessary re-renders. Third, optimize your Redux state or Context API usage to minimize render triggers.
</conversation>
<classification>
{
  "year": "2023",
  "life_area": "projects",
  "topical_tags": [
    {"domain": "software-development", "subdomain": "frontend"},
    {"contextual": "performance"}
  ],
  "conversation_type": "practical",
  "confidence": {
    "overall": 0.95,
    "year": 0.7,
    "life_area": 0.85,
    "domain": 0.98,
    "subdomain": 0.96,
    "contextual": 0.92,
    "conversation_type": 0.97
  }
}
</classification>

Example 2:
<conversation>
User: I'm feeling anxious about my upcoming job interview. Any advice on how to calm my nerves?
Assistant: It's completely normal to feel nervous before an interview. Try these techniques: 1) Practice deep breathing exercises - inhale for 4 counts, hold for 2, exhale for 6. 2) Prepare and rehearse answers to common questions so you feel more confident. 3) Reframe your anxiety as excitement - both have similar physical sensations. 4) Get a good night's sleep and eat a balanced meal beforehand. 5) Arrive early to avoid rushing, which can amplify anxiety.
</conversation>
<classification>
{
  "year": "2023",
  "life_area": "career",
  "topical_tags": [
    {"domain": "psychology", "subdomain": "behavioral"},
    {"contextual": "anxiety"}
  ],
  "conversation_type": "practical",
  "confidence": {
    "overall": 0.92,
    "year": 0.75,
    "life_area": 0.88,
    "domain": 0.93,
    "subdomain": 0.85,
    "contextual": 0.90,
    "conversation_type": 0.95
  }
}
</classification>
`;
  },

  /**
   * Extract relevant sections from content exceeding token limits
   */
  extractRelevantSections(content: string, maxTokens: number): string {
    // Split the content into paragraphs
    const paragraphs = content.split(/\n\s*\n/);

    // If we have 5 or fewer paragraphs, just return the content
    if (paragraphs.length <= 5) {
      return content;
    }

    // Calculate approximate tokens for each paragraph
    const tokenCounts = paragraphs.map((p) => Math.ceil(p.length / 4));

    // Strategy 1: Extract introduction, conclusion, and key sections
    const intro = paragraphs.slice(0, 2).join('\n\n');
    const conclusion = paragraphs.slice(-2).join('\n\n');

    // Strategy 2: Find paragraphs with key indicators (questions, answers, important content)
    const keywordIndicators = [
      'question',
      'answer',
      'important',
      'key',
      'critical',
      'essential',
      'significant',
      'crucial',
      'vital',
      'fundamental',
      'core',
      'central',
      'primary',
      'main',
      'major',
      'summary',
      'conclusion',
      'result',
      'finding',
      'insight',
      'takeaway',
      'recommendation',
      'suggestion',
      'advice',
      'tip',
      'guide',
      'tutorial',
      'instructions',
      'steps',
      'procedure',
      'method',
      'technique',
      'approach',
      'strategy',
      'tactic',
      'plan',
      'framework',
      'model',
      'pattern',
      'template',
      'example',
      'illustration',
      'demonstration',
      'sample',
      'case study',
    ];

    // Score paragraphs by keyword density
    const scores = paragraphs.map((p, i) => {
      // Skip intro and conclusion which we'll include anyway
      if (i < 2 || i >= paragraphs.length - 2) return 0;

      const text = p.toLowerCase();
      const score = keywordIndicators.reduce((acc, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const matches = (text.match(regex) ?? []).length;
        return acc + matches;
      }, 0);

      // Higher score for shorter paragraphs (favor concise statements)
      return score * (100 / Math.max(20, p.length));
    });

    // Select the highest-scoring paragraphs up to our token limit
    const midSections: string[] = [];
    let currentTokens = Math.ceil((intro.length + conclusion.length) / 4);

    // Create array of [index, score] pairs and sort by score
    const scoredIndices = scores
      .map((score, index) => ({ index, score }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    // Take paragraphs until we reach the token limit
    for (const { index } of scoredIndices) {
      const paragraph = paragraphs[index];
      if (paragraph) {
        const tokens = tokenCounts[index] ?? 0;
        if (currentTokens + tokens + 100 <= maxTokens) {
          // 100 token buffer
          midSections.push(paragraph);
          currentTokens += tokens;
        }
      }
    }

    // Ensure sections are in the original order
    midSections.sort((a, b) => {
      const indexA = paragraphs.indexOf(a);
      const indexB = paragraphs.indexOf(b);
      return indexA - indexB;
    });

    // If we haven't added any mid sections, take some evenly spaced ones
    if (midSections.length === 0 && paragraphs.length > 4) {
      const step = Math.max(1, Math.floor((paragraphs.length - 4) / 3));
      for (let i = 2; i < paragraphs.length - 2; i += step) {
        const paragraph = paragraphs[i];
        if (paragraph) {
          const tokens = tokenCounts[i] ?? 0;
          if (currentTokens + tokens + 100 <= maxTokens) {
            midSections.push(paragraph);
            currentTokens += tokens;
          } else {
            break;
          }
        }
      }
    }

    // Combine the sections
    return [
      intro,
      midSections.length > 0 ? '...' : '',
      ...midSections,
      midSections.length > 0 ? '...' : '',
      conclusion,
    ].join('\n\n');
  },
};
