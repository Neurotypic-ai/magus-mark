import { describe, expect, it } from 'vitest';

import { flattenTypeCollections, mapTypeCollection } from './mapTypeCollection';

describe('mapTypeCollection', () => {
  it('should map over a Map collection', () => {
    const collection = new Map([
      ['key1', { id: '1', name: 'Item 1' }],
      ['key2', { id: '2', name: 'Item 2' }],
    ]);

    const result = mapTypeCollection(collection, (item) => item.name);

    expect(result).toEqual(['Item 1', 'Item 2']);
  });

  it('should map over an array collection', () => {
    const collection = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];

    const result = mapTypeCollection(collection, (item) => item.name);

    expect(result).toEqual(['Item 1', 'Item 2']);
  });

  it('should map over a Record collection', () => {
    const collection = {
      key1: { id: '1', name: 'Item 1' },
      key2: { id: '2', name: 'Item 2' },
    };

    const result = mapTypeCollection(collection, (item) => item.name);

    expect(result).toHaveLength(2);
    expect(result).toContain('Item 1');
    expect(result).toContain('Item 2');
  });

  it('should transform items using mapper function', () => {
    const collection = new Map([
      ['1', { value: 10 }],
      ['2', { value: 20 }],
    ]);

    const result = mapTypeCollection(collection, (item) => item.value * 2);

    expect(result).toEqual([20, 40]);
  });
});

describe('flattenTypeCollections', () => {
  it('should flatten Map collections from multiple objects', () => {
    const objects = [
      {
        items: new Map([
          ['a', 1],
          ['b', 2],
        ]),
      },
      {
        items: new Map([
          ['c', 3],
          ['d', 4],
        ]),
      },
    ];

    const result = flattenTypeCollections(objects, 'items');

    expect(result).toEqual([1, 2, 3, 4]);
  });

  it('should flatten array collections from multiple objects', () => {
    const objects = [{ items: [1, 2] }, { items: [3, 4] }];

    const result = flattenTypeCollections(objects, 'items');

    expect(result).toEqual([1, 2, 3, 4]);
  });

  it('should flatten Record collections from multiple objects', () => {
    const objects = [{ items: { a: 1, b: 2 } }, { items: { c: 3, d: 4 } }];

    const result = flattenTypeCollections(objects, 'items');

    expect(result).toHaveLength(4);
    expect(result).toContain(1);
    expect(result).toContain(2);
    expect(result).toContain(3);
    expect(result).toContain(4);
  });

  it('should handle empty collections', () => {
    const objects = [{ items: new Map() }, { items: [] }, { items: {} }];

    const result = flattenTypeCollections(objects, 'items');

    expect(result).toEqual([]);
  });
});
