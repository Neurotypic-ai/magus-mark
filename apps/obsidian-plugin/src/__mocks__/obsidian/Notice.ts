import { vi } from 'vitest';

import type { Notice as NoticeType } from 'obsidian';

// Internal class for Notice instances
class NoticeInternal implements Partial<NoticeType> {
  public message: string;
  public timeout: number | undefined;

  constructor(message: string, timeout?: number) {
    this.message = message;
    this.timeout = timeout ?? undefined;
  }

  public setMessage = vi.fn((message: string): NoticeType => {
    this.message = message;
    return this as unknown as NoticeType;
  });

  public hide = vi.fn((): void => {
    // Mock implementation
  });
}

// Export a spy function that creates Notice instances
export const Notice = vi.fn((message: string, timeout?: number) => {
  return new NoticeInternal(message, timeout);
});
