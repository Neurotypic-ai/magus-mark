import { describe, expect, it } from 'vitest';

import type { AIModel } from './AIModel';

describe('AIModel', () => {
  it('validates AI model type', () => {
    // AIModel is simply a string type
    const model1: AIModel = 'gpt-4o';
    const model2: AIModel = 'gpt-3.5-turbo';
    const model3: AIModel = 'custom-model';

    expect(typeof model1).toBe('string');
    expect(typeof model2).toBe('string');
    expect(typeof model3).toBe('string');
  });
});
