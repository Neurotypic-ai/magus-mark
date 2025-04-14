import { describe, expect, it, vi } from 'vitest';

import type { TypedEventEmitter } from './TypedEventEmitter';

describe('TypedEventEmitter', () => {
  it('demonstrates type-safe events', () => {
    // Define event types
    type Events = Record<string, unknown[]> & {
      'user:created': [userId: string, name: string];
      'post:updated': [postId: string, title: string, content: string];
      error: [error: Error];
    };

    // Create mock event emitter
    const mockEmit = vi.fn();
    const mockOn = vi.fn();
    const mockOff = vi.fn();
    const mockOnce = vi.fn();

    const emitter: TypedEventEmitter<Events> = {
      emit: mockEmit,
      on: mockOn,
      off: mockOff,
      once: mockOnce,
    };

    // Type safety tests
    const userListener = (userId: string, name: string) => {
      expect(typeof userId).toBe('string');
      expect(typeof name).toBe('string');
    };

    emitter.on('user:created', userListener);
    expect(mockOn).toHaveBeenCalledWith('user:created', userListener);

    emitter.emit('user:created', 'user-123', 'John Doe');
    expect(mockEmit).toHaveBeenCalledWith('user:created', 'user-123', 'John Doe');

    const errorListener = (error: Error) => {
      expect(error instanceof Error).toBe(true);
    };

    emitter.on('error', errorListener);
    emitter.emit('error', new Error('Something went wrong'));
  });
});
