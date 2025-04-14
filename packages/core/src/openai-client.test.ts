import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OpenAIClient, DEFAULT_OPENAI_CONFIG } from './openai-client';
import type { AIModel } from '@obsidian-magic/types';
import OpenAI from 'openai';

// Define a type for our mocked OpenAI client
interface MockedOpenAIClient {
  chat: {
    completions: {
      create: ReturnType<typeof vi.fn>;
    };
  };
  moderations: {
    create: ReturnType<typeof vi.fn>;
  };
}

// Mock the OpenAI library and encoding
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            id: 'chat-123',
            choices: [
              {
                message: {
                  content: '{"key": "value"}'
                },
                index: 0,
                finish_reason: 'stop'
              }
            ],
            usage: {
              prompt_tokens: 500,
              completion_tokens: 200,
              total_tokens: 700
            }
          })
        }
      },
      moderations: {
        create: vi.fn().mockResolvedValue({
          results: [
            {
              flagged: false,
              categories: {
                hate: false,
                'hate/threatening': false,
                harassment: false,
                'self-harm': false,
                sexual: false,
                'sexual/minors': false,
                violence: false,
                'violence/graphic': false
              },
              category_scores: {
                hate: 0.01,
                'hate/threatening': 0.01,
                harassment: 0.01,
                'self-harm': 0.01,
                sexual: 0.01,
                'sexual/minors': 0.01,
                violence: 0.01,
                'violence/graphic': 0.01
              }
            }
          ]
        })
      }
    }))
  };
});

vi.mock('tiktoken', () => {
  return {
    encoding_for_model: vi.fn().mockImplementation(() => ({
      encode: vi.fn().mockReturnValue(Array(10).fill(0)),
      decode: vi.fn().mockReturnValue([]),
    }))
  };
});

describe('OpenAIClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config when no config provided', () => {
      const client = new OpenAIClient();
      // Access private members for testing
      const clientPrivate = client as unknown as { config: typeof DEFAULT_OPENAI_CONFIG; client: OpenAI | null };
      expect(clientPrivate.config).toEqual(DEFAULT_OPENAI_CONFIG);
      expect(clientPrivate.client).toBeNull();
    });

    it('should merge provided config with defaults', () => {
      const customConfig = {
        apiKey: 'test-key',
        model: 'gpt-4-32k' as AIModel,
        timeout: 60000
      };
      
      const client = new OpenAIClient(customConfig);
      const clientPrivate = client as unknown as { config: typeof DEFAULT_OPENAI_CONFIG; client: OpenAI | null };
      expect(clientPrivate.config.apiKey).toBe('test-key');
      expect(clientPrivate.config.model).toBe('gpt-4-32k');
      expect(clientPrivate.config.timeout).toBe(60000);
      expect(clientPrivate.config.maxRetries).toBe(DEFAULT_OPENAI_CONFIG.maxRetries);
    });

    it('should initialize OpenAI client if API key is provided', () => {
      const client = new OpenAIClient({ apiKey: 'test-key' });
      expect(OpenAI).toHaveBeenCalledWith(expect.objectContaining({ 
        apiKey: 'test-key',
        timeout: DEFAULT_OPENAI_CONFIG.timeout
      }));
      const clientPrivate = client as unknown as { config: typeof DEFAULT_OPENAI_CONFIG; client: OpenAI | null };
      expect(clientPrivate.client).not.toBeNull();
    });
  });

  describe('setApiKey', () => {
    it('should update API key and initialize client', () => {
      const client = new OpenAIClient();
      const clientPrivate = client as unknown as { config: typeof DEFAULT_OPENAI_CONFIG; client: OpenAI | null };
      expect(clientPrivate.client).toBeNull();
      
      client.setApiKey('new-api-key');
      
      expect(clientPrivate.config.apiKey).toBe('new-api-key');
      expect(OpenAI).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'new-api-key' }));
      expect(clientPrivate.client).not.toBeNull();
    });
  });

  describe('setModel', () => {
    it('should update the model in config', () => {
      const client = new OpenAIClient();
      const clientPrivate = client as unknown as { config: typeof DEFAULT_OPENAI_CONFIG; client: OpenAI | null };
      expect(clientPrivate.config.model).toBe(DEFAULT_OPENAI_CONFIG.model);
      
      client.setModel('gpt-4-turbo' as AIModel);
      
      expect(clientPrivate.config.model).toBe('gpt-4-turbo');
    });
  });

  describe('makeRequest', () => {
    const prompt = 'Test prompt';
    const systemMessage = 'You are a helpful assistant';
    
    it('should return error when client is not initialized', async () => {
      const client = new OpenAIClient();
      
      const result = await client.makeRequest<{ key: string }>(prompt, systemMessage);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MISSING_API_KEY');
      expect(result.data).toBeUndefined();
    });

    it('should make successful API request and parse JSON response', async () => {
      const client = new OpenAIClient({ apiKey: 'test-key' });
      const mockResults = vi.mocked(OpenAI).mock.results;
      if (mockResults[0] === undefined) throw new Error('Mock results not available');
      const mockedClient = mockResults[0].value as MockedOpenAIClient;
      
      const result = await client.makeRequest<{ key: string }>(prompt, systemMessage);
      
      expect(mockedClient.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
        model: DEFAULT_OPENAI_CONFIG.model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ]
      }));
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ key: 'value' });
      expect(result.usage).toBeDefined();
      expect(result.usage?.promptTokens).toBe(500);
      expect(result.usage?.completionTokens).toBe(200);
      expect(result.usage?.totalTokens).toBe(700);
      expect(result.usage?.estimatedCost).toBeGreaterThan(0);
    });

    it('should handle API errors gracefully', async () => {
      const client = new OpenAIClient({ apiKey: 'test-key' });
      const mockResults = vi.mocked(OpenAI).mock.results;
      if (mockResults[0] === undefined) throw new Error('Mock results not available');
      const mockedClient = mockResults[0].value as MockedOpenAIClient;
      
      // Mock an API error
      mockedClient.chat.completions.create.mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );
      
      const result = await client.makeRequest<{ key: string }>(prompt, systemMessage);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it('should handle rate limits with retry-after', async () => {
      const client = new OpenAIClient({ apiKey: 'test-key' });
      const mockResults = vi.mocked(OpenAI).mock.results;
      if (mockResults[0] === undefined) throw new Error('Mock results not available');
      const mockedClient = mockResults[0].value as MockedOpenAIClient;
      
      // Mock a rate limit error with retry-after
      const rateLimitError = new Error('Rate limit exceeded') as Error & { status?: number; headers?: Record<string, string> };
      rateLimitError.status = 429;
      rateLimitError.headers = {
        'retry-after': '30'
      };
      
      mockedClient.chat.completions.create.mockRejectedValueOnce(rateLimitError);
      
      const result = await client.makeRequest<{ key: string }>(prompt, systemMessage, {
        skipRetryDelay: true // Skip delay for testing
      });
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.error?.retryAfter).toBe(30);
    });

    it('should handle invalid JSON responses', async () => {
      const client = new OpenAIClient({ apiKey: 'test-key' });
      const mockResults = vi.mocked(OpenAI).mock.results;
      if (mockResults[0] === undefined) throw new Error('Mock results not available');
      const mockedClient = mockResults[0].value as MockedOpenAIClient;
      
      // Mock an invalid JSON response
      mockedClient.chat.completions.create.mockResolvedValueOnce({
        id: 'chat-123',
        choices: [
          {
            message: {
              content: '{invalid json}'
            },
            index: 0,
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 200,
          total_tokens: 700
        }
      });
      
      const result = await client.makeRequest<{ key: string }>(prompt, systemMessage);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('JSON_PARSE_ERROR');
    });

    it('should apply custom temperature and max tokens', async () => {
      const client = new OpenAIClient({ apiKey: 'test-key' });
      const mockResults = vi.mocked(OpenAI).mock.results;
      if (mockResults[0] === undefined) throw new Error('Mock results not available');
      const mockedClient = mockResults[0].value as MockedOpenAIClient;
      
      await client.makeRequest<{ key: string }>(prompt, systemMessage, {
        temperature: 0.2,
        maxTokens: 500
      });
      
      expect(mockedClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.2,
          max_tokens: 500
        })
      );
    });

    it('should add function tools when provided', async () => {
      const client = new OpenAIClient({ apiKey: 'test-key' });
      const mockResults = vi.mocked(OpenAI).mock.results;
      if (mockResults[0] === undefined) throw new Error('Mock results not available');
      const mockedClient = mockResults[0].value as MockedOpenAIClient;
      
      const functions = [
        {
          name: 'test_function',
          description: 'A test function',
          parameters: {
            type: 'object',
            properties: {
              param1: { type: 'string' }
            }
          }
        }
      ];
      
      await client.makeRequest<{ key: string }>(prompt, systemMessage, {
        functions
      });
      
      expect(mockedClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: [
            {
              type: 'function',
              function: {
                name: 'test_function',
                description: 'A test function',
                parameters: {
                  type: 'object',
                  properties: {
                    param1: { type: 'string' }
                  }
                }
              }
            }
          ]
        })
      );
    });
  });

  describe('moderateContent', () => {
    it('should moderate content and return moderation result', async () => {
      const client = new OpenAIClient({ apiKey: 'test-key' });
      const mockResults = vi.mocked(OpenAI).mock.results;
      if (mockResults[0] === undefined) throw new Error('Mock results not available');
      const mockedClient = mockResults[0].value as MockedOpenAIClient;
      
      const text = 'Sample text for moderation';
      const result = await client.moderateContent(text);
      
      expect(mockedClient.moderations.create).toHaveBeenCalledWith({
        input: text
      });
      
      expect(result.flagged).toBe(false);
      expect(result.categories).toBeDefined();
      expect(result.categoryScores).toBeDefined();
      expect(result.flaggedCategories).toEqual([]);
    });

    it('should handle flagged content properly', async () => {
      const client = new OpenAIClient({ apiKey: 'test-key' });
      const mockResults = vi.mocked(OpenAI).mock.results;
      if (mockResults[0] === undefined) throw new Error('Mock results not available');
      const mockedClient = mockResults[0].value as MockedOpenAIClient;
      
      // Mock flagged content
      mockedClient.moderations.create.mockResolvedValueOnce({
        results: [
          {
            flagged: true,
            categories: {
              hate: true,
              'hate/threatening': false,
              harassment: false,
              'self-harm': false,
              sexual: false,
              'sexual/minors': false,
              violence: false,
              'violence/graphic': false
            },
            category_scores: {
              hate: 0.8,
              'hate/threatening': 0.1,
              harassment: 0.1,
              'self-harm': 0.1,
              sexual: 0.1,
              'sexual/minors': 0.1,
              violence: 0.1,
              'violence/graphic': 0.1
            }
          }
        ]
      });
      
      const text = 'Sample text for moderation';
      const result = await client.moderateContent(text);
      
      expect(result.flagged).toBe(true);
      expect(result.categories['hate']).toBe(true);
      expect(result.flaggedCategories).toContain('hate');
    });
  });

  describe('estimateTokenCount', () => {
    it('should estimate token count for a string', () => {
      const client = new OpenAIClient();
      
      const result = client.estimateTokenCount('Test text');
      
      // We mocked encoding to return 10 tokens
      expect(result).toBe(10);
    });
  });
}); 