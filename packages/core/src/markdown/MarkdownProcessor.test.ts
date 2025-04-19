import { describe, expect, it, vi } from 'vitest';

import { MarkdownProcessor } from './MarkdownProcessor';

describe('Markdown Utilities', () => {
  const processor = MarkdownProcessor.getInstance();

  describe('MarkdownProcessor class', () => {
    it('should extract frontmatter from markdown content', () => {
      const markdown = `---
title: Test Document
date: 2023-01-01
tags: [test, markdown]
---

# Title

Content here.`;

      const frontmatter = processor.extractFrontmatter(markdown);
      expect(frontmatter).toBe(`title: Test Document
date: 2023-01-01
tags: [test, markdown]`);
    });

    it('should parse frontmatter into object', () => {
      const frontmatter = `title: Test Document
date: 2023-01-01
tags: [test, markdown]`;

      const result = processor.parseFrontmatter(frontmatter);
      expect(result).toEqual({
        title: 'Test Document',
        date: '2023-01-01',
        tags: ['test', 'markdown'],
      });
    });
  });

  describe('extractFrontmatter', () => {
    it('should extract frontmatter from markdown content', () => {
      const markdown = `---
title: Test Document
date: 2023-01-01
tags: [test, markdown]
---

# Title

Content here.`;

      const frontmatter = processor.extractFrontmatter(markdown);
      expect(frontmatter).toBe(`title: Test Document
date: 2023-01-01
tags: [test, markdown]`);
    });

    it('should return null when no frontmatter exists', () => {
      const markdown = `# Title

Content here.`;

      const frontmatter = processor.extractFrontmatter(markdown);
      expect(frontmatter).toBeNull();
    });

    it('should handle empty frontmatter', () => {
      const processor = MarkdownProcessor.getInstance();
      const markdown = `---\n---\n# Content`;

      const frontmatter = processor.extractFrontmatter(markdown);
      // The regex captures the content between ---, which is empty.
      expect(frontmatter).toBeNull();
    });
  });

  describe('removeFrontmatter', () => {
    it('should remove frontmatter from markdown content', () => {
      const markdown = `---
title: Test Document
date: 2023-01-01
---

# Title

Content here.`;

      const result = processor.removeFrontmatter(markdown);
      expect(result).toBe(`

# Title

Content here.`);
    });

    it('should return original content when no frontmatter exists', () => {
      const markdown = `# Title

Content here.`;

      const result = processor.removeFrontmatter(markdown);
      expect(result).toBe(markdown);
    });
  });

  describe('parseFrontmatter', () => {
    it('should parse frontmatter into object', () => {
      const frontmatter = `title: Test Document
date: 2023-01-01
tags: [test, markdown]`;

      const result = processor.parseFrontmatter(frontmatter);
      expect(result).toEqual({
        title: 'Test Document',
        date: '2023-01-01',
        tags: ['test', 'markdown'],
      });
    });

    it('should handle empty frontmatter', () => {
      const result = processor.parseFrontmatter('');
      expect(result).toEqual({});
    });

    it('should handle malformed frontmatter', () => {
      const processor = MarkdownProcessor.getInstance();
      const malformed = 'title: Test\ninvalid'; // Missing colon

      // Expect the parseFrontmatter method to throw an error for malformed input
      expect(() => processor.parseFrontmatter(malformed)).toThrow();
    });
  });

  describe('formatFrontmatter', () => {
    it('should format object to YAML frontmatter', () => {
      const frontmatterObj = {
        title: 'Test Document',
        date: '2023-01-01',
        tags: ['test', 'markdown'],
      };

      const result = processor.formatFrontmatter(frontmatterObj);
      expect(result).toContain('title: Test Document');
      expect(result).toContain('date: 2023-01-01');
      expect(result).toContain('tags:');
      expect(result).toContain('  - test');
      expect(result).toContain('  - markdown');
    });

    it('should handle empty arrays', () => {
      const frontmatterObj = {
        title: 'Test Document',
        tags: [],
      };

      const result = processor.formatFrontmatter(frontmatterObj);
      expect(result).toContain('title: Test Document');
      expect(result).toContain('tags: []');
    });

    it('should handle single-item arrays', () => {
      const frontmatterObj = {
        title: 'Test Document',
        tags: ['test'],
      };

      const result = processor.formatFrontmatter(frontmatterObj);
      expect(result).toContain('title: Test Document');
      expect(result).toContain('tags: [test]');
    });

    it('should handle nested objects', () => {
      const frontmatterObj = {
        title: 'Test Document',
        meta: { author: 'John Doe' },
      };

      const result = processor.formatFrontmatter(frontmatterObj);
      expect(result).toContain('title: Test Document');
      expect(result).toContain('meta:');
      expect(result).toContain('{"author":"John Doe"}');
    });
  });

  describe('updateFrontmatter', () => {
    it('should add frontmatter to content without existing frontmatter', () => {
      const markdown = `# Title

Content here.`;

      const frontmatter = {
        title: 'New Title',
        date: '2023-01-01',
      };

      const result = processor.updateFrontmatter(markdown, frontmatter);
      expect(result).toContain('---');
      expect(result).toContain('title: New Title');
      expect(result).toContain('date: 2023-01-01');
      expect(result).toContain('# Title');
      expect(result).toContain('Content here.');
    });

    it('should update existing frontmatter', () => {
      const markdown = `---
title: Old Title
date: 2022-01-01
---

# Content`;

      const frontmatter = {
        title: 'New Title',
        tags: ['test'],
      };

      const result = processor.updateFrontmatter(markdown, frontmatter);
      expect(result).toContain('title: New Title');
      expect(result).toContain('date: 2022-01-01');
      expect(result).toContain('tags: [test]');
      expect(result).toContain('# Content');
    });

    it('should preserve existing content after frontmatter update', () => {
      const markdown = `---
title: Old Title
---

# Content with *markdown*`;

      const frontmatter = {
        title: 'New Title',
      };

      const result = processor.updateFrontmatter(markdown, frontmatter);
      expect(result).toContain('title: New Title');
      expect(result).toContain('# Content with *markdown*');
    });

    it('should handle errors gracefully', () => {
      // Create a console.error spy to suppress errors during test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty to suppress errors
        return undefined;
      });

      const markdown = `---
malformed-frontmatter
---

# Content`;

      const frontmatter = {
        title: 'New Title',
      };

      // Should return original content if error occurs
      const result = processor.updateFrontmatter(markdown, frontmatter);
      expect(result).toBe(markdown);

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
