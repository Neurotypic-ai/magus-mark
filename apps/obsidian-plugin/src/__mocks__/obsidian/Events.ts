import { vi } from 'vitest';

import type { EventRef, Events as EventsType } from 'obsidian';

type EventCallback = (...args: unknown[]) => void;

export class Events implements Partial<EventsType> {
  private listeners: Map<string, EventCallback[]> = new Map();

  public on = vi.fn((name: string, callback: EventCallback): EventRef => {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, []);
    }
    this.listeners.get(name)!.push(callback);

    return {
      callback,
      context: this,
    } as EventRef;
  });

  public off = vi.fn((name: string, callback: EventCallback): void => {
    const callbacks = this.listeners.get(name);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index >= 0) {
        callbacks.splice(index, 1);
      }
    }
  });

  public offref = vi.fn((_ref: EventRef): void => {
    // Mock implementation - parameter marked as unused with underscore
  });

  public trigger = vi.fn((name: string, ...args: unknown[]): void => {
    const callbacks = this.listeners.get(name);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  });
}
