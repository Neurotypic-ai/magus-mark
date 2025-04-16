import { expect } from 'chai';

import type { CursorDocument } from './CursorDocument';

suite('CursorDocument', () => {
  test('validates cursor document', () => {
    const doc: CursorDocument = {
      uri: 'file:///path/to/doc.md',
      path: '/path/to/doc.md',
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
      content: 'This is a document about AI technology',
      metadata: {
        createdAt: '2023-05-15',
        wordCount: 150,
      },
    };

    expect(doc.uri).to.equal('file:///path/to/doc.md');
    expect(doc.path).to.equal('/path/to/doc.md');
    expect(doc.tags.year).to.equal('2023');
    expect(doc.content).to.equal('This is a document about AI technology');
    expect(doc.metadata).to.have.property('wordCount');
  });
});
