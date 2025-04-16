import { describe, expect, it } from 'vitest';

import type { TagTreeNode } from './TagTreeNode';

describe('TagTreeNode', () => {
  it('validates tag tree node', () => {
    // Root node with children
    const rootNode: TagTreeNode = {
      id: 'root',
      label: 'Tags',
      type: 'tag-category',
      tooltip: 'All tags',
      children: [
        {
          id: 'domain-technology',
          label: 'Technology',
          type: 'tag',
          tooltip: 'Technology domain',
          children: [
            {
              id: 'doc-1',
              label: 'document.md',
              type: 'document',
              tooltip: 'Tagged with Technology',
              children: [],
              documentUri: 'file:///path/to/document.md',
              confidence: 0.92,
            },
          ],
          tag: 'technology',
          confidence: 0.95,
          iconPath: '/path/to/tech-icon.svg',
        },
      ],
      iconPath: '/path/to/folder-icon.svg',
    };

    // Fix circular references
    if (rootNode.children[0]) {
      rootNode.children[0].parent = rootNode;

      if (rootNode.children[0].children[0]) {
        rootNode.children[0].children[0].parent = rootNode.children[0];
      }
    }

    expect(rootNode.id).toBe('root');
    expect(rootNode.type).toBe('tag-category');
    expect(rootNode.children).toHaveLength(1);
    expect(rootNode.children[0]?.label).toBe('Technology');
    expect(rootNode.children[0]?.type).toBe('tag');
    expect(rootNode.children[0]?.children[0]?.type).toBe('document');
    expect(rootNode.children[0]?.tag).toBe('technology');
    expect(rootNode.children[0]?.children[0]?.documentUri).toBe('file:///path/to/document.md');

    // Verify enum values
    const validNodeTypes: TagTreeNode['type'][] = ['tag-category', 'tag', 'document'];
    expect(validNodeTypes).toContain(rootNode.type);
    expect(validNodeTypes).toContain(rootNode.children[0]?.type ?? '');
  });
});
