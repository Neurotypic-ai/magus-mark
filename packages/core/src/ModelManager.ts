/**
 * Model Manager for handling OpenAI model availability and selection
 */

import { ModelPricing } from './OpenAIClient';

import type { ModelPricing as ModelPricingType } from './OpenAIClient';

/**
 * Model validation options
 */
export interface ModelValidationOptions {
  /**
   * Whether to verify model availability with API
   */
  verifyWithApi?: boolean;
  /**
   * Whether to throw an error if validation fails
   */
  throwOnInvalid?: boolean;
  /**
   * Whether to return a fallback model if the requested one is not available
   */
  useFallback?: boolean;
}

/**
 * Model validation result
 */
export interface ModelValidationResult {
  /**
   * Whether the model is valid
   */
  valid: boolean;
  /**
   * Model ID to use
   */
  modelId: string;
  /**
   * Error message if validation failed
   */
  errorMessage?: string;
  /**
   * Whether the model was checked against the API
   */
  verifiedWithApi: boolean;
  /**
   * Whether a fallback model was used
   */
  usedFallback: boolean;
}

/**
 * Cached model information to prevent repeated API calls
 */
interface ModelCache {
  apiKey: string;
  timestamp: number;
  models: ModelPricingType[];
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
   * Validate a model ID
   * @param modelId Model ID to validate
   * @param apiKey OpenAI API key
   * @param options Validation options
   * @returns Validation result
   */
  public async validateModel(
    modelId: string,
    apiKey?: string,
    options: ModelValidationOptions = {}
  ): Promise<ModelValidationResult> {
    const { verifyWithApi = true, throwOnInvalid = false, useFallback = true } = options;

    // If no model specified, return invalid
    if (!modelId) {
      const result: ModelValidationResult = {
        valid: false,
        modelId: '',
        errorMessage: 'No model ID provided',
        verifiedWithApi: false,
        usedFallback: false,
      };

      if (throwOnInvalid) {
        throw new Error(result.errorMessage);
      }

      return result;
    }

    // If not verifying with API, return valid
    if (!verifyWithApi || !apiKey) {
      return {
        valid: true,
        modelId,
        verifiedWithApi: false,
        usedFallback: false,
      };
    }

    try {
      // Check if model is available
      const isAvailable = await ModelPricing.isModelAvailable(apiKey, modelId);

      if (isAvailable) {
        return {
          valid: true,
          modelId,
          verifiedWithApi: true,
          usedFallback: false,
        };
      }

      // If model is not available, try to get a fallback
      if (useFallback) {
        const fallbackModel = await this.getBestAvailableModel(apiKey, modelId);

        if (fallbackModel) {
          return {
            valid: true,
            modelId: fallbackModel,
            errorMessage: `Model '${modelId}' not available, using fallback model '${fallbackModel}'`,
            verifiedWithApi: true,
            usedFallback: true,
          };
        }
      }

      // No fallback available
      const result: ModelValidationResult = {
        valid: false,
        modelId,
        errorMessage: `Model '${modelId}' not available${useFallback ? ' and no fallback models available' : ''}`,
        verifiedWithApi: true,
        usedFallback: false,
      };

      if (throwOnInvalid) {
        throw new Error(result.errorMessage);
      }

      return result;
    } catch (error) {
      // Error during validation
      const errorMessage = error instanceof Error ? error.message : String(error);
      const result: ModelValidationResult = {
        valid: false,
        modelId,
        errorMessage: `Error validating model: ${errorMessage}`,
        verifiedWithApi: false,
        usedFallback: false,
      };

      if (throwOnInvalid) {
        throw error instanceof Error ? error : new Error(errorMessage);
      }

      return result;
    }
  }

  /**
   * Get available models for an API key
   * @param apiKey OpenAI API key
   * @param forceRefresh Force refresh the cache
   * @returns Array of available models with pricing information
   */
  public async getAvailableModels(apiKey: string, forceRefresh = false): Promise<ModelPricingType[]> {
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
    const models = await ModelPricing.getAvailableModels(apiKey);

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
  public async getModelsByCategory(apiKey: string, availableOnly = true): Promise<Record<string, ModelPricingType[]>> {
    if (!apiKey) {
      return {}; // Return empty object if no API key
    }

    const models = await this.getAvailableModels(apiKey);
    const filteredModels = availableOnly ? models.filter((model) => model.available) : models;

    // Group by category
    return filteredModels.reduce<Record<string, ModelPricingType[]>>((acc, model) => {
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

    return ModelPricing.isModelAvailable(apiKey, modelId);
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

    return ModelPricing.getRecommendedModel(apiKey, preferredModel);
  }

  /**
   * Get pricing information for a specific model
   * @param modelId Model ID
   * @param apiKey Optional API key to check availability
   * @returns Pricing information or null if not found
   */
  public async getModelPricing(modelId: string, apiKey?: string): Promise<ModelPricingType | null> {
    if (!modelId) {
      return null;
    }

    if (apiKey) {
      const models = await this.getAvailableModels(apiKey);
      const model = models.find((m) => m.id === modelId);
      if (model) return model;
    }

    // Fallback to inferred pricing
    return ModelPricing.getModelPricing(modelId);
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
