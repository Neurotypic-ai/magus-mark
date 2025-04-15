import type { ConversationTypeTag } from './ConversationTypeTag';
import type { LifeAreaTag } from './LifeAreaTag';
import type { TagConfidence } from './TagConfidence';
import type { TopicalTag } from './TopicalTag';
import type { YearTag } from './YearTag';

/**
 * Complete tag set for a conversation
 */

export interface TagSet {
  year: YearTag;
  life_area?: LifeAreaTag | undefined;
  topical_tags: TopicalTag[];
  conversation_type: ConversationTypeTag;
  confidence: TagConfidence;
  explanations?: Record<string, string> | undefined;
}
