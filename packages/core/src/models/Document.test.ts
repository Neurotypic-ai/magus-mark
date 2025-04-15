import { describe, expect, it } from 'vitest';

import type { Document } from './Document';

describe('Document', () => {
  it('validates document object', () => {
    const doc: Document = {
      id: 'doc-123',
      path: '/notes/conversation.md',
      content: 'This is a sample conversation about AI',
      metadata: {
        createdAt: '2023-05-15',
        source: 'chatgpt',
      },
      existingTags: {
        year: '2023',
        topical_tags: [
          {
            domain: 'technology',
          },
        ],
        conversation_type: 'casual',
        confidence: {
          overall: 0.7,
        },
      },
    };

    expect(doc.id).toBe('doc-123');
    expect(doc.path).toBe('/notes/conversation.md');
    expect(doc.content).toBe('This is a sample conversation about AI');
    expect(doc.metadata).toEqual({
      createdAt: '2023-05-15',
      source: 'chatgpt',
    });

    if (
      doc.existingTags &&
      typeof doc.existingTags === 'object' &&
      'year' in doc.existingTags &&
      'topical_tags' in doc.existingTags
    ) {
      expect(doc.existingTags.year).toBe('2023');
      expect(doc.existingTags.topical_tags[0]?.domain).toBe('technology');
    }
  });

  it('validates document with minimal fields', () => {
    const doc: Document = {
      id: 'minimal-doc',
      path: '/path/to/doc.md',
      content: 'Minimal content',
      metadata: {},
    };

    expect(doc.id).toBe('minimal-doc');
    expect(doc.path).toBe('/path/to/doc.md');
    expect(doc.content).toBe('Minimal content');
    expect(doc.existingTags).toBeUndefined();
  });
});
