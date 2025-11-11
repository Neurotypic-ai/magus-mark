import { vi } from 'vitest';

import type { Notice as NoticeType } from 'obsidian';

export class Notice implements Partial<NoticeType> {
  public message: string;
  public timeout: number | undefined;
  public noticeEl: HTMLElement;
  public containerEl: HTMLElement;
  public messageEl: HTMLElement;

  constructor(message: string, timeout?: number) {
    this.message = message;
    if (timeout !== undefined) {
      this.timeout = timeout;
    }
    // Create mock DOM elements
    this.noticeEl = document.createElement('div');
    this.containerEl = document.createElement('div');
    this.messageEl = document.createElement('div');
  }

  public setMessage = vi.fn((message: string | DocumentFragment): Notice => {
    if (typeof message === 'string') {
      this.message = message;
    } else {
      this.message = message.textContent ?? '';
    }
    return this;
  });

  public hide = vi.fn((): void => {
    // Mock implementation
  });
}
