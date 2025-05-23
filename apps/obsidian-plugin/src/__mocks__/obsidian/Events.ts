import { vi } from 'vitest';

import type { EventRef, Events as EventsType } from 'obsidian';

export class Events implements Partial<EventsType> {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  public on = vi.fn((name: string, callback: (...args: any[]) => void): EventRef => {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, []);
    }
    this.listeners.get(name)!.push(callback);

    return {
      callback,
      context: this,
    } as EventRef;
  });

  public off = vi.fn((name: string, callback: (...args: any[]) => void): void => {
    const callbacks = this.listeners.get(name);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index >= 0) {
        callbacks.splice(index, 1);
      }
    }
  });

  public offref = vi.fn((ref: EventRef): void => {
    // Mock implementation
  });

  public trigger = vi.fn((name: string, ...args: any[]): void => {
    const callbacks = this.listeners.get(name);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  });
}
