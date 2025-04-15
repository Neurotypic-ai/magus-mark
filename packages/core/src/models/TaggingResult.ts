import type { TagSet } from './TagSet';

/**
 * Result of a tagging operation
 */

export interface TaggingResult {
  success: boolean;
  tags?: TagSet;
  error?: {
    message: string;
    code: string;
    recoverable: boolean;
  };
}
