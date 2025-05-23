import { vi } from 'vitest';

import type { Notice as NoticeType } from 'obsidian';

export class Notice implements Partial<NoticeType> {
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
