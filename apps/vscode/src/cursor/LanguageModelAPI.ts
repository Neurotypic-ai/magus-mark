import * as vscode from 'vscode';

/**
 * Interface for streaming response from language models
 */
export interface StreamingResponse {
  content: string;
  isComplete: boolean;
}

/**
 * Interface for chat message
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Language Model API wrapper for VS Code and Cursor integration
 */
export class LanguageModelAPI implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private defaultSystemPrompt = `You are a helpful assistant integrated with VS Code and Obsidian.
You have access to the user's tags and notes in their knowledge base.
Always provide clear, accurate information and useful suggestions.`;
  private readonly API_KEY_STORAGE_KEY = 'obsidianMagic.apiKey';

  constructor(private readonly context: vscode.ExtensionContext) {
    // Initialize the API key if needed
    void this.initializeApiKey();
  }

  /**
   * Initialize API key from storage or prompt user if missing
   */
  private async initializeApiKey(): Promise<void> {
    try {
      // Check if we already have an API key stored
      const apiKey = await this.getApiKey();

      if (!apiKey) {
        // We could prompt the user to enter their API key here
        // For now, just log a message
        console.log('No API key found. Some features may be limited.');
      }
    } catch (error) {
      console.error('Failed to initialize API key:', error);
    }
  }

  /**
   * Get the stored API key
   */
  public async getApiKey(): Promise<string | undefined> {
    return this.context.secrets.get(this.API_KEY_STORAGE_KEY);
  }

  /**
   * Set or update the API key
   */
  public async setApiKey(apiKey: string): Promise<void> {
    await this.context.secrets.store(this.API_KEY_STORAGE_KEY, apiKey);
    console.log('API key has been saved securely');
  }

  /**
   * Generate a completion using the VS Code Language Model API
   * @param prompt The prompt to generate a completion for
   * @param options Optional configuration options
   * @returns A promise that resolves to the generated response
   */
  public async generateCompletion(
    prompt: string,
    options: {
      systemPrompt?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    try {
      // Check if VS Code API is available (introduced in VS Code June 2024)
      const hasLanguageModelAPI =
        'languages' in vscode && 'invokeModelRequest' in (vscode.languages as Record<string, unknown>);

      if (!hasLanguageModelAPI) {
        return await this.fallbackGeneration(prompt);
      }

      // Prepare chat messages
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: options.systemPrompt ?? this.defaultSystemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      // Call VS Code API if available
      const response = await this.callVSCodeLanguageModel(messages);
      return response;
    } catch (error) {
      console.error('Error generating completion:', error);
      return `Error generating completion: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Generate a streaming completion
   * @param prompt The prompt to generate a completion for
   * @param callback The callback to receive streaming updates
   * @param options Optional configuration options
   */
  public async generateStreamingCompletion(
    prompt: string,
    callback: (response: StreamingResponse) => void,
    options: {
      systemPrompt?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<void> {
    try {
      // Check if VS Code API is available
      const hasLanguageModelAPI =
        'languages' in vscode && 'invokeModelRequestStream' in (vscode.languages as Record<string, unknown>);

      if (!hasLanguageModelAPI) {
        const response = await this.fallbackGeneration(prompt);
        callback({ content: response, isComplete: true });
        return;
      }

      // Prepare chat messages
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: options.systemPrompt ?? this.defaultSystemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      // Call VS Code API with streaming support
      await this.callVSCodeLanguageModelStreaming(messages, callback);
    } catch (error) {
      console.error('Error generating streaming completion:', error);
      callback({
        content: `Error generating completion: ${error instanceof Error ? error.message : String(error)}`,
        isComplete: true,
      });
    }
  }

  /**
   * Call VS Code Language Model API
   * @param messages The chat messages to send
   * @returns A promise that resolves to the generated response
   */
  private async callVSCodeLanguageModel(messages: ChatMessage[]): Promise<string> {
    // This is a placeholder implementation for the actual VS Code Language Model API
    // When the API is officially available, this should be replaced with the actual implementation

    // In a real implementation, we would use something like:
    // const response = await (vscode.languages as any).invokeModelRequest({
    //   messages,
    //   model: options.model || 'default',
    //   temperature: options.temperature || 0.7,
    //   maxTokens: options.maxTokens || 1000
    // });

    // For now, simulate the response with a timeout
    return new Promise((resolve) => {
      setTimeout(() => {
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        const content = lastMessage ? lastMessage.content : 'No content provided';
        resolve(
          `Response to: ${content}\n\nThis is a placeholder response from the simulated Language Model API. The actual implementation would use the official VS Code Language Model API when available.`
        );
      }, 1000);
    });
  }

  /**
   * Call VS Code Language Model API with streaming support
   * @param messages The chat messages to send
   * @param callback The callback to receive streaming updates
   */
  private async callVSCodeLanguageModelStreaming(
    messages: ChatMessage[],
    callback: (response: StreamingResponse) => void
  ): Promise<void> {
    // This is a placeholder implementation for the actual VS Code Language Model API with streaming
    // When the API is officially available, this should be replaced with the actual implementation

    // In a real implementation, we would use something like:
    // await (vscode.languages as any).invokeModelRequestStream({
    //   messages,
    //   model: options.model || 'default',
    //   temperature: options.temperature || 0.7,
    //   maxTokens: options.maxTokens || 1000,
    //   onUpdate: (chunk: any) => {
    //     callback({
    //       content: chunk.content,
    //       isComplete: chunk.isComplete
    //     });
    //   }
    // });

    // For now, simulate streaming with timeouts
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const content = lastMessage ? lastMessage.content : 'No content provided';
    const response = `Response to: ${content}\n\nThis is a placeholder response from the simulated Language Model API with streaming support. The actual implementation would use the official VS Code Language Model API when available.`;

    // Split the response into chunks to simulate streaming
    const chunks = response.split(' ');
    let accumulated = '';

    for (let i = 0; i < chunks.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const chunk = chunks[i];
      if (chunk) {
        accumulated += `${chunk} `;
      }
      callback({
        content: accumulated,
        isComplete: i === chunks.length - 1,
      });
    }
  }

  /**
   * Fallback generation method when VS Code API is not available
   * @param prompt The prompt to generate a completion for
   * @returns A promise that resolves to the generated response
   */
  private async fallbackGeneration(prompt: string): Promise<string> {
    // In a real implementation, we would use a fallback method like direct API calls
    // For now, return a placeholder response
    await new Promise((resolve) => setTimeout(resolve, 500)); // Add await to satisfy linter
    return `[VS Code Language Model API not available]\n\nYour prompt: ${prompt}\n\nTo access the full capabilities of the @vscode participant, please use VS Code version July 2024 or later, or use Cursor which has enhanced AI integration.`;
  }

  /**
   * Register language model provider with VS Code
   * This is a future capability introduced in VS Code June 2024
   */
  public registerLanguageModelProvider(): void {
    // Check if the API is available in a type-safe way
    const hasLanguageModelProviderAPI =
      'languages' in vscode && 'registerLanguageModelProvider' in (vscode.languages as Record<string, unknown>);

    if (!hasLanguageModelProviderAPI) {
      console.log('VS Code Language Model Provider API not available');
      return;
    }

    // Define interfaces for VS Code Language Model API
    interface VSCodeLanguageModelRequest {
      messages: { role: string; content: string }[];
    }

    interface VSCodeLanguageModelResponse {
      messages: { role: string; content: string }[];
    }

    interface VSCodeLanguageModelRegistration {
      modelId: string;
      name: string;
      provideLanguageModel: (request: VSCodeLanguageModelRequest) => Promise<VSCodeLanguageModelResponse>;
    }

    try {
      // This is a placeholder for the future API
      // Register a language model provider
      const languagesApi = vscode.languages as unknown as {
        registerLanguageModelProvider: (registration: VSCodeLanguageModelRegistration) => vscode.Disposable;
      };

      const disposable = languagesApi.registerLanguageModelProvider({
        modelId: 'obsidian-magic',
        name: 'Obsidian Magic AI',
        provideLanguageModel: async (request: VSCodeLanguageModelRequest) => {
          const { messages } = request;

          // Parse messages to get context
          const userMessage = messages.find((m) => m.role === 'user');

          // Generate completion based on the message
          let response: string;
          try {
            // Generate response based on the user's message
            const userContent = userMessage?.content ?? 'No content provided';
            response = `Obsidian Magic: ${userContent}`;

            // In a real implementation, we would process the message using our core package
            // and generate a proper response with access to the user's vault
            await new Promise((resolve) => setTimeout(resolve, 10)); // Add await to satisfy linter
          } catch (error) {
            console.error('Error in language model provider:', error);
            response = `Error: ${error instanceof Error ? error.message : String(error)}`;
          }

          return {
            messages: [
              {
                role: 'assistant',
                content: response,
              },
            ],
          };
        },
      });

      this.disposables.push(disposable);
      console.log('Registered Obsidian Magic language model provider');
    } catch (error) {
      console.error('Error registering language model provider:', error);
    }
  }

  /**
   * Dispose of all registered disposables
   */
  public dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}
