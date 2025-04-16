/**
 * Tag tree view node for VS Code explorer
 */

export interface TagTreeNode {
  id: string;
  label: string;
  type: 'tag-category' | 'tag' | 'document';
  tooltip?: string;
  parent?: TagTreeNode;
  children: TagTreeNode[];
  tag?: string;
  documentUri?: string;
  confidence?: number;
  iconPath?: string;
}
