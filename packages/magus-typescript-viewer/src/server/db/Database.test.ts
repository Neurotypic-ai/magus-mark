import { describe, expect, it, vi } from 'vitest';

import { Database } from './Database';
import { MockAdapter } from './adapter/MockAdapter';

describe('Database', () => {
  it('should initialize with in-memory database', async () => {
    const adapter = new MockAdapter(':memory:');
    const db = new Database(adapter, ':memory:');

    await expect(db.initializeDatabase()).resolves.toBeUndefined();
  });

  it('should return the adapter instance', () => {
    const adapter = new MockAdapter(':memory:');
    const db = new Database(adapter, ':memory:');

    expect(db.getAdapter()).toBe(adapter);
  });

  it('should close the database connection', async () => {
    const adapter = new MockAdapter(':memory:');
    const db = new Database(adapter, ':memory:');
    const closeSpy = vi.spyOn(adapter, 'close');

    await db.close();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should handle initialization errors gracefully', async () => {
    const adapter = new MockAdapter(':memory:');
    const db = new Database(adapter, ':memory:');

    vi.spyOn(adapter, 'init').mockRejectedValue(new Error('Init failed'));

    await expect(db.initializeDatabase()).rejects.toThrow('Init failed');
  });
});
