import { describe, it, expect } from 'vitest';
import {
  extractFrontmatter,
  extractTagsFromFrontmatter,
  updateTagsInFrontmatter
} from '../../src/utils/frontmatter';

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
          date: '2023-08-15'
        },
        content: '# Content\n\nThis is the main content of the note.'
      });
    });

    it('should handle content without frontmatter', () => {
      const content = '# No Frontmatter\n\nThis content has no frontmatter.';

      const result = extractFrontmatter(content);
      
      expect(result).toEqual({
        frontmatter: {},
        content: '# No Frontmatter\n\nThis content has no frontmatter.'
      });
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---

Content after empty frontmatter.`;

      const result = extractFrontmatter(content);
      
      expect(result).toEqual({
        frontmatter: {},
        content: 'Content after empty frontmatter.'
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
      
      expect(result.frontmatter).toHaveProperty('string', 'Simple string');
      expect(result.frontmatter).toHaveProperty('number', 42);
      expect(result.frontmatter).toHaveProperty('boolean', true);
      expect(result.frontmatter).toHaveProperty('array');
      expect(result.frontmatter.array).toEqual([1, 2, 3]);
      expect(result.frontmatter).toHaveProperty('nested');
      expect(result.frontmatter.nested).toEqual({
        key: 'value',
        another: 'nested value'
      });
    });
  });

  describe('extractTagsFromFrontmatter', () => {
    it('should extract tags from frontmatter object', () => {
      const frontmatter = {
        title: 'Test Note',
        tags: ['javascript', 'typescript', 'react']
      };

      const tags = extractTagsFromFrontmatter(frontmatter);
      
      expect(tags).toEqual({
        uncategorized: ['javascript', 'typescript', 'react']
      });
    });

    it('should extract categorized tags', () => {
      const frontmatter = {
        title: 'Test Note',
        tags: ['javascript', 'typescript'],
        topics: ['frontend', 'web'],
        complexity: ['intermediate']
      };

      const tags = extractTagsFromFrontmatter(frontmatter);
      
      expect(tags).toEqual({
        uncategorized: ['javascript', 'typescript'],
        topics: ['frontend', 'web'],
        complexity: ['intermediate']
      });
    });

    it('should handle string tags', () => {
      const frontmatter = {
        title: 'Test Note',
        tags: 'javascript, typescript, react'
      };

      const tags = extractTagsFromFrontmatter(frontmatter);
      
      expect(tags).toEqual({
        uncategorized: ['javascript', 'typescript', 'react']
      });
    });

    it('should handle empty tags', () => {
      const frontmatter = {
        title: 'Test Note'
      };

      const tags = extractTagsFromFrontmatter(frontmatter);
      
      expect(tags).toEqual({});
    });

    it('should handle different tag formats', () => {
      const frontmatter = {
        title: 'Test Note',
        tags: '#javascript #typescript #react'
      };

      const tags = extractTagsFromFrontmatter(frontmatter);
      
      expect(tags).toEqual({
        uncategorized: ['javascript', 'typescript', 'react']
      });
    });
  });

  describe('updateTagsInFrontmatter', () => {
    it('should add tags to content without existing frontmatter', () => {
      const content = '# No Frontmatter\n\nThis content has no frontmatter.';
      const tags = {
        uncategorized: ['javascript', 'typescript'],
        topics: ['frontend']
      };

      const result = updateTagsInFrontmatter(content, tags);
      
      expect(result).toContain('---');
      expect(result).toContain('tags: [javascript, typescript]');
      expect(result).toContain('topics: [frontend]');
      expect(result).toContain('# No Frontmatter');
    });

    it('should update existing tags in frontmatter', () => {
      const content = `---
title: Test Note
tags: [old-tag]
---

# Content

This is the content.`;
      const tags = {
        uncategorized: ['javascript', 'typescript']
      };

      const result = updateTagsInFrontmatter(content, tags);
      
      expect(result).toContain('title: Test Note');
      expect(result).toContain('tags: [javascript, typescript]');
      expect(result).not.toContain('old-tag');
    });

    it('should merge tags when specified', () => {
      const content = `---
title: Test Note
tags: [existing-tag]
---

# Content`;
      const tags = {
        uncategorized: ['new-tag']
      };

      const result = updateTagsInFrontmatter(content, tags, 'merge');
      
      expect(result).toContain('tags: [existing-tag, new-tag]');
    });

    it('should append tags when specified', () => {
      const content = `---
title: Test Note
tags: [existing-tag]
---

# Content`;
      const tags = {
        uncategorized: ['new-tag']
      };

      const result = updateTagsInFrontmatter(content, tags, 'append');
      
      expect(result).toContain('tags: [existing-tag, new-tag]');
    });

    it('should replace tags when specified', () => {
      const content = `---
title: Test Note
tags: [existing-tag]
---

# Content`;
      const tags = {
        uncategorized: ['new-tag']
      };

      const result = updateTagsInFrontmatter(content, tags, 'replace');
      
      expect(result).toContain('tags: [new-tag]');
      expect(result).not.toContain('existing-tag');
    });

    it('should handle multiple tag categories', () => {
      const content = '# No Frontmatter';
      const tags = {
        uncategorized: ['javascript', 'typescript'],
        topics: ['frontend', 'web'],
        complexity: ['intermediate']
      };

      const result = updateTagsInFrontmatter(content, tags);
      
      expect(result).toContain('tags: [javascript, typescript]');
      expect(result).toContain('topics: [frontend, web]');
      expect(result).toContain('complexity: [intermediate]');
    });
  });
}); 