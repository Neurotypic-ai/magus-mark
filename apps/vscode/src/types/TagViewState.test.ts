import { expect } from 'chai';

import type { TagViewState } from './TagViewState';

suite('TagViewState', () => {
  test('validates tag view state', () => {
    const now = new Date(); // Use a single date for consistency
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
          lastModified: now,
          lastTagged: now,
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
          lastModified: now,
          lastTagged: now,
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
        lastModified: now,
        lastTagged: now,
      },
      selectedTags: ['technology', 'deep-dive'],
      expandedCategories: ['domains', 'conversation-types'],
      filterQuery: 'tech',
    };

    expect(viewState.documents).to.have.lengthOf(2);
    expect(viewState.selectedDocument?.name).to.equal('doc1.md');
    expect(viewState.selectedTags).to.include('technology');
    expect(viewState.expandedCategories).to.include('domains');
    expect(viewState.filterQuery).to.equal('tech');
  });
});
