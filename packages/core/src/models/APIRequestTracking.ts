import type { AIModel } from './AIModel';
import type { APIUsageStats } from './APIUsageStats';

/**
 * API request tracking information
 */

export interface APIRequestTracking {
  requestId: string;
  model: AIModel;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'success' | 'error';
  usage?: APIUsageStats;
  error?: Error;
}
