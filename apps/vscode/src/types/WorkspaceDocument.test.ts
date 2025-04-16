import { describe, expect, it } from 'vitest';

import type { WorkspaceDocument } from './WorkspaceDocument';

describe('WorkspaceDocument', () => {
  it('validates workspace document', () => {
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

    expect(document.uri).toBe('file:///path/to/document.md');
    expect(document.path).toBe('/path/to/document.md');
    expect(document.name).toBe('document.md');
    expect(document.tags.year).toBe('2023');
    expect(document.lastModified).toBe(modifiedDate);
    expect(document.lastTagged).toBe(taggedDate);
  });
});
