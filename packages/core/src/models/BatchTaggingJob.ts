import type { TaggingOptions } from './TaggingOptions';

/**
 * Batch tagging job configuration
 */

export interface BatchTaggingJob {
  id: string;
  documents: string[];
  options: TaggingOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  stats?: {
    startTime: Date;
    endTime?: Date;
    totalTokens: number;
    totalCost: number;
    currency: 'USD';
  };
}
