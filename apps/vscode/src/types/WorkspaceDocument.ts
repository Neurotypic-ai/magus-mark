import type { TagSet } from '@magus-mark/core/models/TagSet';

/**
 * Workspace document with tags
 */

export interface WorkspaceDocument {
  uri: string;
  path: string;
  name: string;
  tags: TagSet;
  lastModified: Date;
  lastTagged: Date;
}
