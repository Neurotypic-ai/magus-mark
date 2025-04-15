import { describe, expect, it } from 'vitest';

import type { ConversationTypeTag } from './ConversationTypeTag';

describe('ConversationTypeTag', () => {
  it('validates ConversationTypeTag type usage', () => {
    const validConversationTypes: ConversationTypeTag[] = ['deep-dive', 'practical', 'theory', 'question', 'analysis'];

    expect(validConversationTypes.length).toBeGreaterThan(0);
    validConversationTypes.forEach((type) => {
      expect(typeof type).toBe('string');
    });
  });
});
