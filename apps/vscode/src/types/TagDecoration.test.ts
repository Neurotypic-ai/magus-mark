import { expect } from 'chai';

import type { TagDecoration } from './TagDecoration';

suite('TagDecoration', () => {
  test('validates tag decoration', () => {
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

    expect(decoration.tag).to.equal('technology');
    expect(decoration.style.backgroundColor).to.equal('#e6f7ff');
    expect(decoration.style.color).to.equal('#0077cc');
    expect(decoration.hoverMessage).to.equal('Technology tag (confidence: 0.92)');
  });
});
