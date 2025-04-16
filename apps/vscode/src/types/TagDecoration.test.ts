import { describe, expect, it } from 'vitest';

import type { TagDecoration } from './TagDecoration';

describe('TagDecoration', () => {
  it('validates tag decoration', () => {
    const decoration: TagDecoration = {
      tag: 'technology',
      style: {
        backgroundColor: '#e6f7ff',
        color: '#0077cc',
        border: '1px solid #0077cc',
        borderRadius: '3px',
        fontWeight: 'bold',
      },
      hoverMessage: 'Technology tag (confidence: 0.92)',
    };

    expect(decoration.tag).toBe('technology');
    expect(decoration.style.backgroundColor).toBe('#e6f7ff');
    expect(decoration.style.color).toBe('#0077cc');
    expect(decoration.hoverMessage).toBe('Technology tag (confidence: 0.92)');
  });
});
