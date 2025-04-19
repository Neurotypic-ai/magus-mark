import { vi } from 'vitest';

// Helper for returning typed mocks under isolatedDeclarations
type MockFactory<T> = () => T;

/**
 * Interface for mocked OpenAI client
 */
export interface MockedOpenAIClient {
  chat: {
    completions: {
      create: ReturnType<typeof vi.fn>;
    };
  };
  moderations: {
    create: ReturnType<typeof vi.fn>;
  };
}

/**
 * Creates a mock for OpenAI API responses
 */
export const mockOpenAI: MockFactory<MockedOpenAIClient> = () => ({
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        id: 'chat-123',
        choices: [
          {
            message: {
              content: '{"key": "value"}',
            },
            index: 0,
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 200,
          total_tokens: 700,
        },
      }),
    },
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
            'violence/graphic': false,
          },
          category_scores: {
            hate: 0.01,
            'hate/threatening': 0.01,
            harassment: 0.01,
            'self-harm': 0.01,
            sexual: 0.01,
            'sexual/minors': 0.01,
            violence: 0.01,
            'violence/graphic': 0.01,
          },
        },
      ],
    }),
  },
});

/**
 * Interface for mocked OpenAI client used by tagging service
 */
export interface MockedOpenAITaggingClient {
  makeRequest: ReturnType<typeof vi.fn>;
  setApiKey: ReturnType<typeof vi.fn>;
  setModel: ReturnType<typeof vi.fn>;
  estimateTokenCount: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock for OpenAI client for tagging service integration tests
 */
export const mockOpenAIClient: MockFactory<MockedOpenAITaggingClient> = () => ({
  makeRequest: vi.fn().mockImplementation(() => ({
    success: true,
    data: {
      year: '2023',
      life_area: 'learning',
      topical_tags: [{ domain: 'software-development', subdomain: 'frontend' }, { contextual: 'tutorial' }],
      conversation_type: 'practical',
      confidence: {
        overall: 0.92,
        year: 0.95,
        life_area: 0.85,
        domain: 0.93,
        subdomain: 0.9,
        contextual: 0.87,
        conversation_type: 0.91,
      },
      explanations: {
        contextual_tag:
          "Selected 'tutorial' because the conversation walks through a step-by-step process of learning React hooks.",
      },
    },
    usage: {
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
      estimatedCost: 0.015,
    },
  })),
  setApiKey: vi.fn(),
  setModel: vi.fn(),
  estimateTokenCount: vi.fn(),
});
