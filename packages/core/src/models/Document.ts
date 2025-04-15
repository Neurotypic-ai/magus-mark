import type { TagSet } from './TagSet';

/**
 * Document representing a conversation to be tagged
 */

export interface Document {
  id: string;
  path: string;
  content: string;
  metadata: Record<string, unknown>;
  existingTags?: TagSet | undefined;
}
