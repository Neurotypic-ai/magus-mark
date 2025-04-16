import { describe, expect, it } from 'vitest';

import type { TagViewState } from './TagViewState';

describe('TagViewState', () => {
  it('validates tag view state', () => {
    const viewState: TagViewState = {
      documents: [
        {
          uri: 'file:///path/to/doc1.md',
          path: '/path/to/doc1.md',
          name: 'doc1.md',
          tags: {
            year: '2023',
            topical_tags: [{ domain: 'technology' }],
            conversation_type: 'deep-dive',
            confidence: { overall: 0.92 },
          },
          lastModified: new Date(),
          lastTagged: new Date(),
        },
        {
          uri: 'file:///path/to/doc2.md',
          path: '/path/to/doc2.md',
          name: 'doc2.md',
          tags: {
            year: '2023',
            topical_tags: [{ domain: 'business' }],
            conversation_type: 'analysis',
            confidence: { overall: 0.88 },
          },
          lastModified: new Date(),
          lastTagged: new Date(),
        },
      ],
      selectedDocument: {
        uri: 'file:///path/to/doc1.md',
        path: '/path/to/doc1.md',
        name: 'doc1.md',
        tags: {
          year: '2023',
          topical_tags: [{ domain: 'technology' }],
          conversation_type: 'deep-dive',
          confidence: { overall: 0.92 },
        },
        lastModified: new Date(),
        lastTagged: new Date(),
      },
      selectedTags: ['technology', 'deep-dive'],
      expandedCategories: ['domains', 'conversation-types'],
      filterQuery: 'tech',
    };

    expect(viewState.documents).toHaveLength(2);
    expect(viewState.selectedDocument?.name).toBe('doc1.md');
    expect(viewState.selectedTags).toContain('technology');
    expect(viewState.expandedCategories).toContain('domains');
    expect(viewState.filterQuery).toBe('tech');
  });
});
