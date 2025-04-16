import { expect } from 'chai';

import type { TagTreeNode } from './TagTreeNode';

suite('TagTreeNode', () => {
  test('validates tag tree node', () => {
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

    // Assign parent references - Parent property is optional
    if (rootNode.children[0]) {
      rootNode.children[0].parent = rootNode;
      if (rootNode.children[0].children[0]) {
        rootNode.children[0].children[0].parent = rootNode.children[0];
      }
    }

    expect(rootNode.id).to.equal('root');
    expect(rootNode.type).to.equal('tag-category');
    expect(rootNode.children).to.have.lengthOf(1);
    // Use optional chaining for potentially undefined children
    expect(rootNode.children[0]?.label).to.equal('Technology');
    expect(rootNode.children[0]?.type).to.equal('tag');
    expect(rootNode.children[0]?.children[0]?.type).to.equal('document');
    expect(rootNode.children[0]?.tag).to.equal('technology');
    expect(rootNode.children[0]?.children[0]?.documentUri).to.equal('file:///path/to/document.md');

    // Verify enum values
    const validNodeTypes: TagTreeNode['type'][] = ['tag-category', 'tag', 'document'];
    expect(validNodeTypes).to.include(rootNode.type);
    expect(validNodeTypes).to.include(rootNode.children[0]?.type ?? '');
  });
});
