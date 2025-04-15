import { describe, expect, it } from 'vitest';

import type { PredefinedContextualTag } from './PredefinedContextualTag';

describe('PredefinedContextualTag', () => {
  it('accepts predefined tag values', () => {
    // These are type tests - they'll compile if the typing is correct
    const tag1: PredefinedContextualTag = 'beginner';
    const tag2: PredefinedContextualTag = 'advanced';
    const tag3: PredefinedContextualTag = 'resources';

    expect(typeof tag1).toBe('string');
    expect(typeof tag2).toBe('string');
    expect(typeof tag3).toBe('string');
  });

  it('can be used in arrays of predefined tags', () => {
    const tags: PredefinedContextualTag[] = ['beginner', 'advanced', 'resources'];

    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBe(3);
    expect(tags).toContain('beginner');
    expect(tags).toContain('resources');
  });

  it('represents one of the predefined contextual tag values', () => {
    // This is a type test - in practice we'd validate against actual constants
    const predefinedTags = ['beginner', 'intermediate', 'advanced', 'resources'];
    const tag: PredefinedContextualTag = 'beginner';

    expect(predefinedTags).toContain(tag);
  });
});
