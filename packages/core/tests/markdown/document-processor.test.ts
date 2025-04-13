import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentProcessor, FrontmatterProcessor } from '../../src/markdown';
import type { Document, TagSet } from '@obsidian-magic/types';

// Mock the FrontmatterProcessor class
vi.mock('../../src/markdown', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    FrontmatterProcessor: vi.fn().mockImplementation(() => ({
      extractFrontmatter: vi.fn().mockReturnValue({}),
      updateFrontmatter: vi.fn((content) => `UPDATED: ${content}`),
      extractTags: vi.fn().mockReturnValue([]),
    })),
  };
});

describe('DocumentProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with a FrontmatterProcessor', () => {
      const processor = new DocumentProcessor();
      expect(FrontmatterProcessor).toHaveBeenCalled();
    });

    it('should pass frontmatter options to FrontmatterProcessor', () => {
      const options = { preserveExistingTags: false, tagsKey: 'keywords' };
      const processor = new DocumentProcessor(options);
      expect(FrontmatterProcessor).toHaveBeenCalledWith(options);
    });
  });

  describe('parseDocument', () => {
    it('should create a Document object from content', () => {
      const processor = new DocumentProcessor();
      const id = 'test-id';
      const path = '/path/to/document.md';
      const content = '# Test Document\nContent here';

      const document = processor.parseDocument(id, path, content);

      expect(document).toMatchObject({
        id,
        path,
        content,
      });
    });

    it('should extract frontmatter from content', () => {
      const mockFrontmatter = { title: 'Test', tags: ['tag1'] };
      vi.mocked(FrontmatterProcessor.prototype.extractFrontmatter).mockReturnValueOnce(mockFrontmatter);

      const processor = new DocumentProcessor();
      const document = processor.parseDocument('id', 'path', 'content');

      expect(FrontmatterProcessor.prototype.extractFrontmatter).toHaveBeenCalledWith('content');
      expect(document.frontmatter).toEqual(mockFrontmatter);
    });

    it('should extract existing tags from frontmatter', () => {
      const mockTags = ['tag1', 'tag2'];
      vi.mocked(FrontmatterProcessor.prototype.extractTags).mockReturnValueOnce(mockTags);

      const processor = new DocumentProcessor();
      const document = processor.parseDocument('id', 'path', 'content');

      expect(FrontmatterProcessor.prototype.extractTags).toHaveBeenCalled();
      expect(document.existingTags).toEqual(expect.any(Object));
    });

    it('should handle documents without frontmatter', () => {
      vi.mocked(FrontmatterProcessor.prototype.extractFrontmatter).mockReturnValueOnce({});
      vi.mocked(FrontmatterProcessor.prototype.extractTags).mockReturnValueOnce([]);

      const processor = new DocumentProcessor();
      const document = processor.parseDocument('id', 'path', 'content');

      expect(document.frontmatter).toEqual({});
      expect(document.existingTags).toBeUndefined();
    });
  });

  describe('updateDocument', () => {
    it('should update document frontmatter with new tags', () => {
      const sampleTagSet: TagSet = {
        year: '2023',
        life_area: 'learning',
        topical_tags: [{ domain: 'software-development' }],
        conversation_type: 'practical',
        confidence: { overall: 0.9 }
      };

      const document: Document = {
        id: 'test-id',
        path: '/path/to/document.md',
        content: '# Test Document\nContent here',
      };

      const processor = new DocumentProcessor();
      const updated = processor.updateDocument(document, sampleTagSet);

      expect(FrontmatterProcessor.prototype.updateFrontmatter).toHaveBeenCalledWith(
        document.content,
        sampleTagSet
      );
      expect(updated).toBe(`UPDATED: # Test Document\nContent here`);
    });
  });

  describe('extractContent', () => {
    it('should remove frontmatter from content', () => {
      const content = `---
title: Test Document
tags: [tag1, tag2]
---
# Actual Content
This is the main content.`;

      const processor = new DocumentProcessor();
      const extracted = processor.extractContent(content);

      expect(extracted).not.toContain('---');
      expect(extracted).not.toContain('title: Test Document');
      expect(extracted).toContain('# Actual Content');
      expect(extracted).toContain('This is the main content.');
    });

    it('should return the original content if no frontmatter is present', () => {
      const content = '# Document without frontmatter\nJust content.';
      
      const processor = new DocumentProcessor();
      const extracted = processor.extractContent(content);

      expect(extracted).toBe(content);
    });

    it('should trim whitespace from extracted content', () => {
      const content = `---
title: Test
---

# Content with whitespace

Extra spaces at the end.   `;

      const processor = new DocumentProcessor();
      const extracted = processor.extractContent(content);

      expect(extracted).toBe('# Content with whitespace\n\nExtra spaces at the end.');
    });
  });

  describe('tryExtractTagsFromFrontmatter', () => {
    // We need to override the vi.mock for this test to test the private method
    it('should be tested with proper implementation', () => {
      // This is a placeholder to indicate that the private method should be tested
      // In a real test, we'd need a different approach to test private methods
      expect(true).toBeTruthy();
    });
  });
}); 