import { vi } from 'vitest';

/**
 * Mock implementation of VS Code EventEmitter
 */
export class EventEmitter {
  event = vi.fn();
  fire = vi.fn();
  dispose = vi.fn();
}

export default EventEmitter;
