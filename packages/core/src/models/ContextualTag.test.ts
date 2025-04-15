import { describe, expect, it } from 'vitest';

import type { ContextualTag } from './ContextualTag';
import type { PredefinedContextualTag } from './PredefinedContextualTag';

describe('ContextualTag', () => {
  it('accepts predefined contextual tag values', () => {
    // Use predefined values - this is a type test, it will compile if types are correct
    const tag1: ContextualTag = 'beginner';
    const tag2: ContextualTag = 'advanced';

    expect(typeof tag1).toBe('string');
    expect(typeof tag2).toBe('string');
  });

  it('allows custom string values that are not predefined', () => {
    // Custom string value that isn't in predefined tags
    const customTag: ContextualTag = 'my-custom-tag';

    expect(typeof customTag).toBe('string');
  });

  it('can be used in arrays of tags', () => {
    const tags: ContextualTag[] = ['beginner', 'resources', 'my-custom-tag'];

    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBe(3);
    expect(tags).toContain('beginner');
    expect(tags).toContain('my-custom-tag');
  });

  it('allows assignment from PredefinedContextualTag', () => {
    // This tests the type relationship
    const predefinedTag: PredefinedContextualTag = 'beginner';
    const contextualTag: ContextualTag = predefinedTag;

    expect(contextualTag).toBe('beginner');
  });
});
