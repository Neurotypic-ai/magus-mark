import { describe, expect, it } from 'vitest';

import { extractFrontmatter, extractTagsFromFrontmatter, updateTagsInFrontmatter } from './frontmatter';

import type { ConversationTypeTag } from '@magus-mark/core/models/ConversationTypeTag';
import type { TagConfidence } from '@magus-mark/core/models/TagConfidence';
import type { TagSet } from '@magus-mark/core/models/TagSet';
import type { TopicalTag } from '@magus-mark/core/models/TopicalTag';

describe('Frontmatter Utility', () => {
  describe('extractFrontmatter', () => {
    it('should extract frontmatter from markdown content', () => {
      const content = `---
title: Test Note
tags: [test, markdown]
date: 2023-08-15
---

# Content

This is the main content of the note.`;

      const result = extractFrontmatter(content);

      expect(result).toEqual({
        frontmatter: {
          title: 'Test Note',
          tags: ['test', 'markdown'],
          date: new Date('2023-08-15T00:00:00.000Z'),
        },
        content: '\n# Content\n\nThis is the main content of the note.',
      });
    });

    it('should handle content without frontmatter', () => {
      const content = '# No Frontmatter\n\nThis content has no frontmatter.';

      const result = extractFrontmatter(content);

      expect(result).toEqual({
        frontmatter: null,
        content: '# No Frontmatter\n\nThis content has no frontmatter.',
      });
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---

Content after empty frontmatter.`;

      const result = extractFrontmatter(content);

      expect(result).toEqual({
        frontmatter: {},
        content: '\nContent after empty frontmatter.',
      });
    });

    it('should handle frontmatter with various data types', () => {
      const content = `---
string: Simple string
number: 42
boolean: true
array: [1, 2, 3]
nested:
  key: value
  another: nested value
date: 2023-08-15
---

Content here`;

      const result = extractFrontmatter(content);

      expect(result.frontmatter).not.toBeNull();
      if (result.frontmatter) {
        expect(result.frontmatter).toHaveProperty('string', 'Simple string');
        expect(result.frontmatter).toHaveProperty('number', 42);
        expect(result.frontmatter).toHaveProperty('boolean', true);
        expect(result.frontmatter).toHaveProperty('array');
        expect(result.frontmatter['array']).toEqual([1, 2, 3]);
        expect(result.frontmatter).toHaveProperty('nested');
        expect(result.frontmatter['nested']).toEqual({
          key: 'value',
          another: 'nested value',
        });
      }
    });
  });

  describe('extractTagsFromFrontmatter', () => {
    it('should extract tags from frontmatter object', () => {
      const topicalTag: TopicalTag = {
        domain: 'technology',
      };

      const confidence: TagConfidence = {
        overall: 0.9,
      };

      const markdown = `---
title: Test Note
tags:
  magusMark:
    year: "2023"
    topical_tags: [${JSON.stringify(topicalTag)}]
    conversation_type: "deep-dive"
    confidence: ${JSON.stringify(confidence)}
---
Test content`;

      const tags = extractTagsFromFrontmatter(markdown);

      expect(tags).toEqual({
        year: '2023',
        topical_tags: [topicalTag],
        conversation_type: 'deep-dive' as ConversationTypeTag,
        confidence: confidence,
      });
    });

    it('should return undefined when no tags are found', () => {
      const markdown = `---
title: Test Note
---
Test content`;

      const tags = extractTagsFromFrontmatter(markdown);

      expect(tags).toBeUndefined();
    });
  });

  describe('updateTagsInFrontmatter', () => {
    it('should add tags to content without existing frontmatter', () => {
      const content = '# No Frontmatter\n\nThis content has no frontmatter.';
      const topicalTag: TopicalTag = {
        domain: 'technology',
      };

      const tags: TagSet = {
        year: '2023',
        topical_tags: [topicalTag],
        conversation_type: 'deep-dive',
        confidence: {
          overall: 0.9,
        },
      };

      const result = updateTagsInFrontmatter(content, tags);

      expect(result).toContain('---');
      expect(result).toContain('tags');
      expect(result).toContain('magusMark');
      expect(result).toContain('# No Frontmatter');
    });

    it('should update existing tags in frontmatter', () => {
      const content = `---
title: Test Note
tags:
  magusMark:
    year: "2022"
    topical_tags: [{"domain":"science"}]
    conversation_type: "question"
    confidence: {"overall":0.7}
---

# Content

This is the content.`;
      const topicalTag: TopicalTag = {
        domain: 'technology',
      };

      const tags: TagSet = {
        year: '2023',
        topical_tags: [topicalTag],
        conversation_type: 'deep-dive',
        confidence: {
          overall: 0.9,
        },
      };

      const result = updateTagsInFrontmatter(content, tags);

      expect(result).toContain('title: Test Note');
      expect(result).toContain('tags:');
      expect(result).toContain('magusMark:');
      expect(result).toMatch(/year:\s*'?2023'?/);
      expect(result).toMatch(/domain:\s*'?technology'?/);
      expect(result).toContain('# Content\n\nThis is the content.');
    });
  });
});
