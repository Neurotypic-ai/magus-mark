import type { AIModel } from './AIModel';
import type { TagBehavior } from './TagBehavior';

/**
 * Options for tagging operations
 */

export interface TaggingOptions {
  model: AIModel;
  behavior: TagBehavior;
  minConfidence: number;
  reviewThreshold: number;
  generateExplanations: boolean;
}
