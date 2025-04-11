/**
 * OpenAI model discovery and pricing information
 */
import OpenAI from 'openai';

/**
 * Model pricing information
 */
export interface ModelPricing {
  id: string;
  name: string; // Display name
  inputPrice: number; // Price per 1M tokens
  outputPrice: number; // Price per 1M tokens
  contextWindow: number;
  available: boolean;
  deprecated: boolean;
  category: string;
}

/**
 * Get available models from OpenAI API
 * @param apiKey OpenAI API key
 * @returns Array of available model IDs and their properties
 */
export async function getAvailableModels(apiKey: string): Promise<ModelPricing[]> {
  if (!apiKey) {
    return []; // Return empty array if no API key provided
  }

  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey,
    });

    // Get list of models
    const response = await openai.models.list();

    // Map to model pricing objects with inferred pricing based on model name patterns
    return response.data.map((model) => {
      const modelId = model.id;
      const pricing = inferModelPricing(modelId);

      return {
        id: modelId,
        name: formatModelName(modelId),
        inputPrice: pricing.inputPrice,
        outputPrice: pricing.outputPrice,
        contextWindow: inferContextWindow(modelId),
        available: true,
        deprecated: false,
        category: inferModelCategory(modelId),
      };
    });
  } catch (error) {
    console.error('Error fetching available models:', error);
    return []; // Return empty array on error, not defaults
  }
}

/**
 * Format model name for display
 */
function formatModelName(modelId: string): string {
  return modelId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Infer model pricing based on name patterns
 */
function inferModelPricing(modelId: string): { inputPrice: number; outputPrice: number } {
  const modelLower = modelId.toLowerCase();

  // GPT-4 pricing tiers
  if (modelLower.includes('gpt-4o')) {
    if (modelLower.includes('mini')) {
      return { inputPrice: 2.5, outputPrice: 7.5 }; // GPT-4o Mini pricing
    }
    return { inputPrice: 10.0, outputPrice: 30.0 }; // GPT-4o pricing
  }

  if (modelLower.includes('gpt-4')) {
    if (modelLower.includes('turbo') || modelLower.includes('vision')) {
      return { inputPrice: 10.0, outputPrice: 30.0 }; // GPT-4 Turbo/Vision pricing
    }
    return { inputPrice: 30.0, outputPrice: 60.0 }; // GPT-4 base pricing
  }

  // O1 & O3 pricing tiers
  if (modelLower.startsWith('o3')) {
    if (modelLower.includes('mini')) {
      return { inputPrice: 15.0, outputPrice: 45.0 };
    }
    return { inputPrice: 40.0, outputPrice: 120.0 };
  }

  if (modelLower.startsWith('o1')) {
    if (modelLower.includes('mini')) {
      return { inputPrice: 25.0, outputPrice: 75.0 };
    }
    return { inputPrice: 50.0, outputPrice: 150.0 };
  }

  // GPT-3.5 pricing tiers
  if (modelLower.includes('gpt-3.5')) {
    if (modelLower.includes('instruct')) {
      return { inputPrice: 1.5, outputPrice: 2.0 };
    }
    return { inputPrice: 0.5, outputPrice: 1.5 };
  }

  // Base models
  if (modelLower.includes('davinci')) {
    return { inputPrice: 2.0, outputPrice: 2.0 };
  }

  if (modelLower.includes('babbage')) {
    return { inputPrice: 0.4, outputPrice: 0.4 };
  }

  // Default fallback for unknown models
  return { inputPrice: 5.0, outputPrice: 15.0 };
}

/**
 * Infer context window size based on model name
 */
function inferContextWindow(modelId: string): number {
  const modelLower = modelId.toLowerCase();

  if (modelLower.includes('gpt-4o') || modelLower.includes('gpt-4-turbo') || modelLower.includes('o1')) {
    return 128000; // Large context window models
  }

  if (modelLower.includes('o3')) {
    return 200000; // O3 has 200k context
  }

  if (modelLower.includes('gpt-4') && !modelLower.includes('turbo')) {
    return 8192; // Base GPT-4
  }

  if (modelLower.includes('gpt-3.5-turbo')) {
    return 16385; // GPT-3.5 Turbo
  }

  if (modelLower.includes('gpt-3.5-turbo-instruct')) {
    return 4096; // GPT-3.5 Turbo Instruct
  }

  // Default for other models
  return 16384;
}

/**
 * Infer model category based on name
 */
function inferModelCategory(modelId: string): string {
  const modelLower = modelId.toLowerCase();

  if (modelLower.startsWith('o3')) return 'o3';
  if (modelLower.startsWith('o1')) return 'o1';
  if (modelLower.includes('gpt-4')) return 'gpt4';
  if (modelLower.includes('gpt-3.5')) return 'gpt3.5';
  if (modelLower.includes('davinci') || modelLower.includes('babbage')) return 'base';

  // For other models, try to extract category from name
  const parts = modelLower.split('-');
  if (parts.length > 0 && parts[0]) {
    return parts[0];
  }

  return 'other';
}

/**
 * Get pricing information for a specific model
 * @param modelId Model ID
 * @returns Pricing information or null if not found
 */
export function getModelPricing(modelId: string): ModelPricing | null {
  if (!modelId) return null;

  const pricing = inferModelPricing(modelId);

  return {
    id: modelId,
    name: formatModelName(modelId),
    inputPrice: pricing.inputPrice,
    outputPrice: pricing.outputPrice,
    contextWindow: inferContextWindow(modelId),
    available: true, // We don't know availability without an API call
    deprecated: false,
    category: inferModelCategory(modelId),
  };
}

/**
 * Calculate cost for a model based on tokens
 * @param model Model ID
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @returns Cost in USD
 */
export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = getModelPricing(model);
  if (!pricing) return 0;

  return (inputTokens / 1000000) * pricing.inputPrice + (outputTokens / 1000000) * pricing.outputPrice;
}

/**
 * Check if a model is available for a given API key
 * @param apiKey OpenAI API key
 * @param modelId Model ID to check
 * @returns Promise resolving to boolean indicating availability
 */
export async function isModelAvailable(apiKey: string, modelId: string): Promise<boolean> {
  if (!apiKey || !modelId) return false;

  try {
    const models = await getAvailableModels(apiKey);
    return models.some((model) => model.id === modelId);
  } catch (error) {
    console.error('Error checking model availability:', error);
    return false;
  }
}

/**
 * Get recommended model based on user preferences and availability
 * @param apiKey OpenAI API key
 * @param preferredModel Preferred model ID
 * @returns Promise resolving to recommended model ID or an empty string if no model is available
 */
export async function getRecommendedModel(apiKey: string, preferredModel: string): Promise<string> {
  if (!apiKey) return '';

  try {
    // Check if preferred model is available
    const isAvailable = await isModelAvailable(apiKey, preferredModel);
    if (isAvailable) return preferredModel;

    // Get all available models
    const models = await getAvailableModels(apiKey);
    if (models.length > 0) {
      // Return first available model
      return models[0].id;
    }

    return ''; // No models available
  } catch (error) {
    console.error('Error getting recommended model:', error);
    return ''; // No default fallbacks
  }
}
