import type { ConfidenceScore } from './ConfidenceScore';

/**
 * Confidence scores for each tag category
 */

export interface TagConfidence {
  overall: ConfidenceScore;
  year?: ConfidenceScore;
  life_area?: ConfidenceScore;
  domain?: ConfidenceScore;
  subdomain?: ConfidenceScore;
  contextual?: ConfidenceScore;
  conversation_type?: ConfidenceScore;
}
