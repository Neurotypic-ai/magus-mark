import type { TagSet } from './TagSet';

/**
 * Result of a tagging operation
 */

export interface TaggingResult {
  success: boolean;
  tags?: TagSet;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost?: number;
  };
  error?: {
    message: string;
    code: string;
    recoverable: boolean;
  };
}
