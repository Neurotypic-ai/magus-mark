import { expect } from 'chai';

import type { WorkspaceDocument } from './WorkspaceDocument';

suite('WorkspaceDocument', () => {
  test('validates workspace document', () => {
    const modifiedDate = new Date(Date.now() - 3600000); // 1 hour ago
    const taggedDate = new Date();

    const document: WorkspaceDocument = {
      uri: 'file:///path/to/document.md',
      path: '/path/to/document.md',
      name: 'document.md',
      tags: {
        year: '2023',
        topical_tags: [
          {
            domain: 'technology',
            subdomain: 'ai',
          },
        ],
        conversation_type: 'deep-dive',
        confidence: {
          overall: 0.92,
        },
      },
      lastModified: modifiedDate,
      lastTagged: taggedDate,
    };

    expect(document.uri).to.equal('file:///path/to/document.md');
    expect(document.path).to.equal('/path/to/document.md');
    expect(document.name).to.equal('document.md');
    expect(document.tags.year).to.equal('2023');
    expect(document.lastModified).to.equal(modifiedDate);
    expect(document.lastTagged).to.equal(taggedDate);
  });
});
