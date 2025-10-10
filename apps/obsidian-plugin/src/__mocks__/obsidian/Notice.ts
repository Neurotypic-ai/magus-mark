import { vi } from 'vitest';

import type { Notice as NoticeType } from 'obsidian';

// Internal class for Notice instances
class NoticeInternal implements Partial<NoticeType> {
  public message: string;
  public timeout?: number;

  constructor(message: string, timeout?: number) {
    this.message = message;
    this.timeout = timeout;
  }

  public setMessage = vi.fn((message: string): void => {
    this.message = message;
  });

  public hide = vi.fn((): void => {
    // Mock implementation
  });
}

// Export a spy function that creates Notice instances
export const Notice = vi.fn((message: string, timeout?: number) => {
  return new NoticeInternal(message, timeout);
});
