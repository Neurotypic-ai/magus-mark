import { describe, expect, it } from 'vitest';

import type { APIKeyStorage } from './APIKeyStorage';

describe('APIKeyStorage', () => {
  it('validates API storage locations', () => {
    // APIKeyStorage is a union of literal string types
    const storage1: APIKeyStorage = 'local';
    const storage2: APIKeyStorage = 'system';

    expect(storage1).toBe('local');
    expect(storage2).toBe('system');

    // Type checking - only allowed values should compile
    const validStorageValues: APIKeyStorage[] = ['local', 'system'];
    expect(validStorageValues).toContain(storage1);
  });
});
