import type { AIModel } from './AIModel';
import type { APIKeyStorage } from './APIKeyStorage';

/**
 * Authentication and API configuration
 */

export interface APIConfig {
  apiKey: string;
  apiKeyStorage: APIKeyStorage;
  organizationId?: string;
  defaultModel: AIModel;
  timeoutMs: number;
  maxRetries: number;
  costPerTokenMap: Record<AIModel, number>;
}
