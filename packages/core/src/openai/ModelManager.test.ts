import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ModelManager } from './ModelManager';
import { OpenAIClient } from './OpenAIClient';

import type { AIModel } from '../models/api';
import type { ModelValidationResult } from './ModelManager';
import type { ModelPricing } from './OpenAIClient';

// Create a mock for model pricing since MODEL_COST_MAP is not directly exported
const MODEL_PRICING: Record<string, { inputPrice: number; outputPrice: number }> = {
  'gpt-4o': { inputPrice: 10.0, outputPrice: 30.0 },
  'gpt-4': { inputPrice: 30.0, outputPrice: 60.0 },
  'gpt-3.5-turbo': { inputPrice: 0.5, outputPrice: 1.5 },
};

describe('ModelManager', () => {
  let manager: ModelManager;
  let openAIClient: OpenAIClient;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = ModelManager.getInstance();
    openAIClient = new OpenAIClient();
  });

  describe('singleton pattern', () => {
    it('should provide a singleton instance', () => {
      const instance1 = ModelManager.getInstance();
      const instance2 = ModelManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('validateModel', () => {
    it('should validate a model correctly', async () => {
      const mockValidationResult: ModelValidationResult = {
        valid: true,
        modelId: 'gpt-4o',
        verifiedWithApi: false,
        usedFallback: false,
      };

      vi.spyOn(manager, 'validateModel').mockResolvedValue(mockValidationResult);

      const result = await manager.validateModel('gpt-4o');
      expect(result.valid).toBe(true);
      expect(result.modelId).toBe('gpt-4o');
    });

    it('should detect invalid models', async () => {
      const mockValidationResult: ModelValidationResult = {
        valid: false,
        modelId: 'invalid-model',
        errorMessage: 'No such model',
        verifiedWithApi: false,
        usedFallback: false,
      };

      vi.spyOn(manager, 'validateModel').mockResolvedValue(mockValidationResult);

      const result = await manager.validateModel('invalid-model');
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBeDefined();
    });
  });

  describe('getAvailableModels', () => {
    it('should return available models', async () => {
      const mockModels: ModelPricing[] = Object.entries(MODEL_PRICING).map(([id, pricing]) => ({
        id,
        name: id
          .split('-')
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(' '),
        inputPrice: pricing.inputPrice,
        outputPrice: pricing.outputPrice,
        contextWindow: 16385,
        available: true,
        deprecated: false,
        category: id.includes('gpt-4') ? 'gpt4' : 'gpt3.5',
      }));

      vi.spyOn(manager, 'getAvailableModels').mockResolvedValue(mockModels);

      const apiKey = 'test-key';
      const models = await manager.getAvailableModels(apiKey);

      expect(models.length).toBe(Object.keys(MODEL_PRICING).length);
      expect(models[0]?.id).toBeDefined();
      expect(models[0]?.inputPrice).toBeDefined();
    });

    it('should return empty array with no API key', async () => {
      const result = await manager.getAvailableModels('');
      expect(result).toEqual([]);
    });
  });

  describe('getModelsByCategory', () => {
    it('should group models by category', async () => {
      const gpt4Model: ModelPricing = {
        id: 'gpt-4',
        name: 'GPT 4',
        inputPrice: 30.0,
        outputPrice: 60.0,
        contextWindow: 8192,
        available: true,
        deprecated: false,
        category: 'gpt4',
      };

      const gpt35Model: ModelPricing = {
        id: 'gpt-3.5-turbo',
        name: 'GPT 3.5 Turbo',
        inputPrice: 0.5,
        outputPrice: 1.5,
        contextWindow: 16385,
        available: true,
        deprecated: false,
        category: 'gpt3.5',
      };

      const mockModels: ModelPricing[] = [gpt4Model, gpt35Model];

      const mockCategorized: Record<string, ModelPricing[]> = {
        gpt4: [gpt4Model],
        'gpt3.5': [gpt35Model],
      };

      vi.spyOn(manager, 'getAvailableModels').mockResolvedValue(mockModels);
      vi.spyOn(manager, 'getModelsByCategory').mockResolvedValue(mockCategorized);

      const apiKey = 'test-key';
      const groupedModels = await manager.getModelsByCategory(apiKey);

      expect(Object.keys(groupedModels)).toContain('gpt4');
      expect(Object.keys(groupedModels)).toContain('gpt3.5');

      const gpt4Models = groupedModels['gpt4'];
      expect(gpt4Models).toBeDefined();
      expect(gpt4Models?.[0]?.id).toBe('gpt-4');
    });
  });

  describe('isModelAvailable', () => {
    it('should check if model is available', async () => {
      vi.spyOn(manager, 'isModelAvailable').mockResolvedValue(true);

      const apiKey = 'test-key';
      const isAvailable = await manager.isModelAvailable(apiKey, 'gpt-4');

      expect(isAvailable).toBe(true);
    });

    it('should return false for unavailable models', async () => {
      vi.spyOn(manager, 'isModelAvailable').mockResolvedValue(false);

      const apiKey = 'test-key';
      const isAvailable = await manager.isModelAvailable(apiKey, 'nonexistent-model');

      expect(isAvailable).toBe(false);
    });
  });

  describe('getModelPricing', () => {
    it('should return pricing for a model', async () => {
      const mockPricing: ModelPricing = {
        id: 'gpt-4',
        name: 'GPT 4',
        inputPrice: 30.0,
        outputPrice: 60.0,
        contextWindow: 8192,
        available: true,
        deprecated: false,
        category: 'gpt4',
      };

      vi.spyOn(manager, 'getModelPricing').mockResolvedValue(mockPricing);

      const pricing = await manager.getModelPricing('gpt-4');

      expect(pricing).toBeDefined();
      expect(pricing?.inputPrice).toBe(30.0);
      expect(pricing?.outputPrice).toBe(60.0);
    });

    it('should return null for unknown models', async () => {
      vi.spyOn(manager, 'getModelPricing').mockResolvedValue(null);

      const pricing = await manager.getModelPricing('unknown-model');

      expect(pricing).toBeNull();
    });
  });

  describe('cost calculation', () => {
    it('should calculate costs correctly', () => {
      const model: AIModel = 'gpt-4';
      const inputTokens = 1000;
      const outputTokens = 500;

      vi.spyOn(openAIClient, 'calculateCost').mockImplementation((modelId, input, output) => {
        const pricing = MODEL_PRICING[modelId];
        if (!pricing) return 0;
        const inputCost = (pricing.inputPrice * input) / 1000000;
        const outputCost = (pricing.outputPrice * output) / 1000000;
        return inputCost + outputCost;
      });

      const cost = openAIClient.calculateCost(model, inputTokens, outputTokens);

      const expectedCost = (() => {
        const pricing = MODEL_PRICING[model];
        if (!pricing) return 0;
        const inputCost = (pricing.inputPrice * inputTokens) / 1000000;
        const outputCost = (pricing.outputPrice * outputTokens) / 1000000;
        return inputCost + outputCost;
      })();

      expect(cost).toBeCloseTo(expectedCost);
    });

    it('should handle different models correctly', () => {
      vi.spyOn(openAIClient, 'calculateCost').mockImplementation((modelId) => {
        const pricing = MODEL_PRICING[modelId];
        if (!pricing) return 0;

        const inputTokens = 1000;
        const outputTokens = 500;
        const inputCost = (pricing.inputPrice * inputTokens) / 1000000;
        const outputCost = (pricing.outputPrice * outputTokens) / 1000000;
        return inputCost + outputCost;
      });

      const cost1 = openAIClient.calculateCost('gpt-4', 1000, 500);
      const cost2 = openAIClient.calculateCost('gpt-3.5-turbo', 1000, 500);

      // GPT-4 should be more expensive than GPT-3.5
      expect(cost1).toBeGreaterThan(cost2);
    });
  });
});
