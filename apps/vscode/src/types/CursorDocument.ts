import type { TagSet } from '@magus-mark/core/models/TagSet';

/**
 * Cursor document integration
 */

export interface CursorDocument {
  uri: string;
  path: string;
  tags: TagSet;
  content: string;
  metadata: Record<string, unknown>;
}
