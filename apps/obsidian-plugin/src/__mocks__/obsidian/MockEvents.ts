import type { EventRef, Events } from 'obsidian';

class MockEvents implements Events {
  on: (...args: unknown[]) => EventRef = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
  off: (...args: unknown[]) => void = vi.fn();
  offref: (...args: unknown[]) => void = vi.fn();
  trigger: (...args: unknown[]) => void = vi.fn();
  tryTrigger: (...args: unknown[]) => void = vi.fn();
}

export { MockEvents as Events };
