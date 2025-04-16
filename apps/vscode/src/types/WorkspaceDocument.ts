import type { TagSet } from '@obsidian-magic/core/models/TagSet';

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
