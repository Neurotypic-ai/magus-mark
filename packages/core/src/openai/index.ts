/**
 * OpenAI integration module
 */
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
    retryAfter?: number;
    statusCode?: number;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

/**
 * OpenAI API client for making requests with retry logic and error handling
 */
export class OpenAIClient {
  private config: OpenAIConfig;
  
  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = { ...DEFAULT_OPENAI_CONFIG, ...config };
  }
  
  /**
   * Set API key for the client
   */
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
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
      temperature?: number,
      maxTokens?: number,
      functions?: Record<string, unknown>[]
    } = {}
  ): Promise<OpenAIResponse<T>> {
    // This would contain the actual API call implementation
    // with proper rate limit handling and retries
    
    // For now, we'll return a mock implementation
    // In a real implementation, this would make the API call using fetch or axios
    return {
      success: true,
      data: { message: "Mock response" } as unknown as T,
      usage: {
        promptTokens: prompt.length / 4,
        completionTokens: 100,
        totalTokens: prompt.length / 4 + 100,
        estimatedCost: (prompt.length / 4 + 100) * 0.00001,
      }
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
    // A very rough approximation (in a real implementation we would use tiktoken)
    // GPT models use ~4 characters per token on average
    return Math.ceil(text.length / 4);
  }
}

/**
 * Prompt engineering utilities for constructing effective prompts
 */
export class PromptEngineering {
  /**
   * Create a structured tagging prompt
   */
  static createTaggingPrompt(
    content: string,
    taxonomy: Record<string, unknown>,
    options: {
      includeExamples?: boolean,
      maxLength?: number
    } = {}
  ): string {
    const { includeExamples = true, maxLength } = options;
    
    // Truncate content if needed
    const processedContent = maxLength && content.length > maxLength
      ? `${content.substring(0, maxLength)}... (content truncated)`
      : content;
    
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
  }
  
  /**
   * Get examples for few-shot learning
   */
  private static getTaggingExamples(): string {
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
    "year": 0.7,
    "life_area": 0.95,
    "domain": 0.87,
    "subdomain": 0.85,
    "contextual": 0.93,
    "conversation_type": 0.96
  }
}
</classification>
`;
  }
  
  /**
   * Extract the most relevant sections from a long conversation
   */
  static extractRelevantSections(content: string, maxTokens: number): string {
    // In a real implementation, this would use embeddings or other techniques
    // to extract the most relevant parts of the conversation
    
    // For now, just a simple truncation
    const estimatedTokens = Math.ceil(content.length / 4);
    
    if (estimatedTokens <= maxTokens) {
      return content;
    }
    
    // Simple extraction of first and last parts
    const charsToKeep = maxTokens * 4;
    const firstPart = Math.floor(charsToKeep * 0.6);
    const lastPart = Math.floor(charsToKeep * 0.4);
    
    return `${content.substring(0, firstPart)}
... (content summarized) ...
${content.substring(content.length - lastPart)}`;
  }
} 