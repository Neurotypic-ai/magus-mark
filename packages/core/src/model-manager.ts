/**
 * Model Manager for handling OpenAI model availability and selection
 */

import { getAvailableModels, getModelPricing, getRecommendedModel } from './openai-models';

import type { ModelPricing } from './openai-models';

/**
 * Cached model information to prevent repeated API calls
 */
interface ModelCache {
  apiKey: string;
  timestamp: number;
  models: ModelPricing[];
}

/**
 * Class for managing model availability and selection
 */
export class ModelManager {
  private static instance: ModelManager | undefined;
  private modelCache: ModelCache | null = null;
  private cacheExpiryMs = 30 * 60 * 1000; // 30 minutes

  /**
   * Private constructor (singleton)
   */
  private constructor() {
    // Initialization
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ModelManager {
    ModelManager.instance ??= new ModelManager();
    return ModelManager.instance;
  }

  /**
   * Get available models for an API key
   * @param apiKey OpenAI API key
   * @param forceRefresh Force refresh the cache
   * @returns Array of available models with pricing information
   */
  public async getAvailableModels(apiKey: string, forceRefresh = false): Promise<ModelPricing[]> {
    if (!apiKey) {
      return []; // Return empty array if no API key
    }

    // Return from cache if valid and API key matches
    if (
      !forceRefresh &&
      this.modelCache &&
      this.modelCache.apiKey === apiKey &&
      Date.now() - this.modelCache.timestamp < this.cacheExpiryMs
    ) {
      return this.modelCache.models;
    }

    // Fetch new data
    const models = await getAvailableModels(apiKey);

    // Update cache
    this.modelCache = {
      apiKey,
      timestamp: Date.now(),
      models,
    };

    return models;
  }

  /**
   * Get models grouped by category
   * @param apiKey OpenAI API key
   * @param availableOnly Only include available models
   * @returns Models grouped by category
   */
  public async getModelsByCategory(apiKey: string, availableOnly = true): Promise<Record<string, ModelPricing[]>> {
    if (!apiKey) {
      return {}; // Return empty object if no API key
    }

    const models = await this.getAvailableModels(apiKey);
    const filteredModels = availableOnly ? models.filter((model) => model.available) : models;

    // Group by category
    return filteredModels.reduce<Record<string, ModelPricing[]>>((acc, model) => {
      const category = model.category || 'other';
      acc[category] ??= [];
      acc[category].push(model);
      return acc;
    }, {});
  }

  /**
   * Check if a specific model is available
   * @param apiKey OpenAI API key
   * @param modelId Model ID to check
   * @returns Whether the model is available
   */
  public async isModelAvailable(apiKey: string, modelId: string): Promise<boolean> {
    if (!apiKey || !modelId) {
      return false;
    }

    const models = await this.getAvailableModels(apiKey);
    return models.some((model) => model.id === modelId);
  }

  /**
   * Get best available model based on preferred model
   * @param apiKey OpenAI API key
   * @param preferredModel Preferred model ID
   * @returns Model ID of best available model or empty string if none available
   */
  public async getBestAvailableModel(apiKey: string, preferredModel: string): Promise<string> {
    if (!apiKey) {
      return '';
    }

    return getRecommendedModel(apiKey, preferredModel);
  }

  /**
   * Get pricing information for a specific model
   * @param modelId Model ID
   * @param apiKey Optional API key to check availability
   * @returns Pricing information or null if not found
   */
  public async getModelPricing(modelId: string, apiKey?: string): Promise<ModelPricing | null> {
    if (!modelId) {
      return null;
    }

    if (apiKey) {
      const models = await this.getAvailableModels(apiKey);
      const model = models.find((m) => m.id === modelId);
      if (model) return model;
    }

    // Fallback to inferred pricing
    return getModelPricing(modelId);
  }

  /**
   * Clear the cache
   */
  public clearCache(): void {
    this.modelCache = null;
  }
}

// Export singleton instance
export const modelManager = ModelManager.getInstance();
