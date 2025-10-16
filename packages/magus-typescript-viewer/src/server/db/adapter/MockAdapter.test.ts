import { describe, expect, it } from 'vitest';

import { MockAdapter } from './MockAdapter';

describe('MockAdapter', () => {
  it('should initialize without errors', async () => {
    const adapter = new MockAdapter();
    await expect(adapter.init()).resolves.toBeUndefined();
  });

  it('should return database path', () => {
    const adapter = new MockAdapter('/test/path.db');
    expect(adapter.getDbPath()).toBe('/test/path.db');
  });

  it('should default to memory path', () => {
    const adapter = new MockAdapter();
    expect(adapter.getDbPath()).toBe(':memory:');
  });

  it('should handle INSERT queries', async () => {
    const adapter = new MockAdapter();
    await adapter.init();

    const result = await adapter.query('INSERT INTO users (name) VALUES (?)', ['John']);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('id');
  });

  it('should handle SELECT queries', async () => {
    const adapter = new MockAdapter();
    await adapter.init();

    await adapter.query('INSERT INTO users (name) VALUES (?)', ['John']);
    const result = await adapter.query('SELECT * FROM users');

    expect(result).toHaveLength(1);
  });

  it('should handle transactions with commit', async () => {
    const adapter = new MockAdapter();
    await adapter.init();

    const result = await adapter.transaction(async () => {
      await adapter.query('INSERT INTO users (name) VALUES (?)', ['John']);
      return 'success';
    });

    expect(result).toBe('success');
  });

  it('should rollback transaction on error', async () => {
    const adapter = new MockAdapter();
    await adapter.init();

    await expect(
      adapter.transaction(async () => {
        await adapter.query('INSERT INTO users (name) VALUES (?)', ['John']);
        throw new Error('Transaction failed');
      })
    ).rejects.toThrow('Transaction failed');
  });

  it('should close without errors', async () => {
    const adapter = new MockAdapter();
    await adapter.init();
    await expect(adapter.close()).resolves.toBeUndefined();
  });
});
