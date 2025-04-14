import { describe, expect, it } from 'vitest';

import { DEFAULT_FRONTMATTER_OPTIONS } from '../models/frontmatter-options';
import { FrontmatterProcessor } from './frontmatter-processor';

import type { FrontmatterOptions } from '../models/frontmatter-options';
import type { TagSet } from '../models/tags';

// Replace the interface with this type
interface TestFrontmatterProcessorType {
  options: FrontmatterOptions;
}

describe('FrontmatterProcessor', () => {
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const processor = new FrontmatterProcessor();
      // Cast to our test interface to access private properties
      const testProcessor = processor as unknown as TestFrontmatterProcessorType;
      expect(testProcessor.options).toEqual(DEFAULT_FRONTMATTER_OPTIONS);
    });

    it('should merge provided options with defaults', () => {
      const processor = new FrontmatterProcessor({
        preserveExistingTags: false,
        tagsKey: 'keywords',
      });
      const testProcessor = processor as unknown as TestFrontmatterProcessorType;
      expect(testProcessor.options.preserveExistingTags).toBe(false);
      expect(testProcessor.options.tagsKey).toBe('keywords');
      expect(testProcessor.options.useNestedKeys).toBe(DEFAULT_FRONTMATTER_OPTIONS.useNestedKeys);
    });
  });

  describe('extractFrontmatter', () => {
    it('should extract frontmatter from markdown content', () => {
      const processor = new FrontmatterProcessor();
      const content = `---
title: Test Document
tags: [tag1, tag2]
date: 2023-01-01
---
# Content`;

      const frontmatter = processor.extractFrontmatter(content);
      expect(frontmatter).toEqual({
        title: 'Test Document',
        tags: ['tag1', 'tag2'],
        date: '2023-01-01',
      });
    });

    it('should return empty object when no frontmatter is present', () => {
      const processor = new FrontmatterProcessor();
      const content = '# Content without frontmatter';
      const frontmatter = processor.extractFrontmatter(content);
      expect(frontmatter).toEqual({});
    });

    it('should handle malformed frontmatter gracefully', () => {
      const processor = new FrontmatterProcessor();
      const malformedContent = `---
title: Malformed
tags: [unclosed array
---
# Content`;

      expect(() => processor.extractFrontmatter(malformedContent)).toThrow();
    });
  });

  describe('extractTags', () => {
    it('should extract tags from array in frontmatter', () => {
      const processor = new FrontmatterProcessor();
      const frontmatter = {
        tags: ['tag1', 'tag2', 'tag3'],
      };
      const tags = processor.extractTags(frontmatter);
      expect(tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should extract tags from comma-separated string', () => {
      const processor = new FrontmatterProcessor();
      const frontmatter = {
        tags: 'tag1, tag2, tag3',
      };
      const tags = processor.extractTags(frontmatter);
      expect(tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should return empty array when no tags are present', () => {
      const processor = new FrontmatterProcessor();
      const frontmatter = { title: 'No Tags' };
      const tags = processor.extractTags(frontmatter);
      expect(tags).toEqual([]);
    });

    it('should use custom tags key if specified', () => {
      const processor = new FrontmatterProcessor({ tagsKey: 'keywords' });
      const frontmatter = {
        keywords: ['key1', 'key2'],
      };
      const tags = processor.extractTags(frontmatter);
      expect(tags).toEqual(['key1', 'key2']);
    });
  });

  describe('tagsToFrontmatter', () => {
    const sampleTagSet: TagSet = {
      year: '2023',
      life_area: 'learning',
      topical_tags: [
        { domain: 'software-development', subdomain: 'frontend' },
        { domain: 'programming', contextual: 'tutorial' },
      ],
      conversation_type: 'practical',
      confidence: {
        overall: 0.9,
        year: 0.95,
        life_area: 0.85,
        domain: 0.9,
        conversation_type: 0.92,
      },
    };

    it('should convert TagSet to frontmatter with default options', () => {
      const processor = new FrontmatterProcessor();
      const frontmatter = processor.tagsToFrontmatter(sampleTagSet);

      expect(frontmatter['tags']).toEqual([
        '#year/2023',
        '#learning',
        '#software-development/frontend',
        '#programming/tutorial',
        '#type/practical',
      ]);
    });

    it('should use custom tag formatter if provided', () => {
      const processor = new FrontmatterProcessor({
        tagFormatter: (tag) => tag.replace('#', ''),
      });

      const frontmatter = processor.tagsToFrontmatter(sampleTagSet);

      expect(frontmatter['tags']).toEqual([
        'year/2023',
        'learning',
        'software-development/frontend',
        'programming/tutorial',
        'type/practical',
      ]);
    });

    it('should create nested structure when useNestedKeys is true', () => {
      const processor = new FrontmatterProcessor({ useNestedKeys: true });
      const frontmatter = processor.tagsToFrontmatter(sampleTagSet);

      expect(frontmatter).toEqual({
        tags: ['#year/2023', '#learning', '#software-development/frontend', '#programming/tutorial', '#type/practical'],
        year: '2023',
        life_area: 'learning',
        topical_tags: [
          { domain: 'software-development', subdomain: 'frontend' },
          { domain: 'programming', contextual: 'tutorial' },
        ],
        conversation_type: 'practical',
      });
    });
  });

  describe('updateFrontmatter', () => {
    const sampleTagSet: TagSet = {
      year: '2023',
      life_area: 'learning',
      topical_tags: [{ domain: 'software-development', subdomain: 'frontend' }],
      conversation_type: 'practical',
      confidence: {
        overall: 0.9,
        year: 0.95,
        life_area: 0.85,
        domain: 0.9,
        conversation_type: 0.92,
      },
    };

    it('should add frontmatter to content without existing frontmatter', () => {
      const processor = new FrontmatterProcessor();
      const content = '# Document with no frontmatter';

      const updated = processor.updateFrontmatter(content, sampleTagSet);

      expect(updated).toContain('---');
      expect(updated).toContain('tags:');
      expect(updated).toContain('#year/2023');
      expect(updated).toContain('#learning');
      expect(updated).toContain('#software-development/frontend');
      expect(updated).toContain('#type/practical');
      expect(updated).toContain('# Document with no frontmatter');
    });

    it('should update existing frontmatter while preserving other fields', () => {
      const processor = new FrontmatterProcessor();
      const content = `---
title: Existing Document
author: Test User
tags: [old-tag]
---
# Document content`;

      const updated = processor.updateFrontmatter(content, sampleTagSet);

      expect(updated).toContain('title: Existing Document');
      expect(updated).toContain('author: Test User');
      expect(updated).toContain('#year/2023');
      expect(updated).toContain('#learning');
      expect(updated).toContain('#software-development/frontend');
      expect(updated).toContain('#type/practical');
      expect(updated).not.toContain('old-tag');
    });

    it('should preserve existing tags when preserveExistingTags is true', () => {
      const processor = new FrontmatterProcessor({ preserveExistingTags: true });
      const content = `---
title: Existing Document
tags: [existing-tag]
---
# Document content`;

      const updated = processor.updateFrontmatter(content, sampleTagSet);

      expect(updated).toContain('existing-tag');
      expect(updated).toContain('#year/2023');
      expect(updated).toContain('#learning');
    });

    it('should replace existing tags when preserveExistingTags is false', () => {
      const processor = new FrontmatterProcessor({ preserveExistingTags: false });
      const content = `---
title: Existing Document
tags: [existing-tag]
---
# Document content`;

      const updated = processor.updateFrontmatter(content, sampleTagSet);

      expect(updated).not.toContain('existing-tag');
      expect(updated).toContain('#year/2023');
      expect(updated).toContain('#learning');
    });
  });
});
