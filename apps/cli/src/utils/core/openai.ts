/**
 * OpenAI client and related types for the CLI
 * Re-exports OpenAI-related functionality from the core package
 */

// Export OpenAI client
export { OpenAIClient } from '@obsidian-magic/core/openai/OpenAIClient';

// Export API types
export type { AIModel, APIConfig, ModelPricing } from '@obsidian-magic/core/models/api';
