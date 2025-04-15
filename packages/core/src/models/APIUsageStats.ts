/**
 * API usage statistics
 */

export interface APIUsageStats {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  currency: 'USD';
}
