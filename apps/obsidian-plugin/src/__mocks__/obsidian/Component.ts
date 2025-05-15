import { vi } from 'vitest';

import { Events } from './MockEvents';

import type { Component as ComponentType, EventRef } from 'obsidian';
import type { Mock } from 'vitest';

export class Component extends Events implements ComponentType {
  load: Mock<() => void> = vi.fn();
  onload: Mock<() => void> = vi.fn();
  unload: Mock<() => void> = vi.fn();
  onunload: Mock<() => void> = vi.fn();

  addChild<T extends ComponentType>(child: T): T {
    // console.log('MockComponent.addChild called with', child);
    return child;
  }

  removeChild<T extends ComponentType>(child: T): T {
    // console.log('MockComponent.removeChild called with', child);
    return child;
  }

  register(cb: () => any): void {
    // console.log('MockComponent.register called with', cb);
    cb(); // Call the callback for basic mock behavior
  }

  registerEvent(_eventRef: EventRef): void {
    // console.log('MockComponent.registerEvent called with', _eventRef);
    // Basic mock: can track refs if needed for testing
  }

  registerDomEvent<K extends keyof WindowEventMap>(
    _el: Window,
    _type: K,
    _callback: (this: HTMLElement, ev: WindowEventMap[K]) => any,
    _options?: boolean | AddEventListenerOptions
  ): void;
  registerDomEvent<K extends keyof DocumentEventMap>(
    _el: Document,
    _type: K,
    _callback: (this: HTMLElement, ev: DocumentEventMap[K]) => any,
    _options?: boolean | AddEventListenerOptions
  ): void;
  registerDomEvent<K extends keyof HTMLElementEventMap>(
    _el: HTMLElement,
    _type: K,
    _callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    _options?: boolean | AddEventListenerOptions
  ): void;
  registerDomEvent(
    _el: EventTarget,
    _type: string,
    _callback: (this: HTMLElement, ev: Event) => any,
    _options?: boolean | AddEventListenerOptions
  ): void {
    // console.log('MockComponent.registerDomEvent called');
    // Actual event listener registration might be too complex/side-effectful for a base mock.
  }

  registerInterval(_id: number): number {
    // console.log('MockComponent.registerInterval called');
    return 0; // Return a number as per Obsidian API
  }

  // containerEl is part of ComponentType but not explicitly initialized here.
  // It's often managed by the subclass (like View or ItemView) or passed in.
  // For a base mock, we can declare it.
  containerEl!: HTMLElement; // Definite assignment assertion for mocks if not init in constructor

  constructor() {
    super();
    this.addChild = vi.fn(this.addChild);
    this.removeChild = vi.fn(this.removeChild);
    this.register = vi.fn(this.register);
    this.registerEvent = vi.fn(this.registerEvent);
    this.registerDomEvent = vi.fn(this.registerDomEvent) as any; // Cast to any to satisfy multiple overloads with a single mock implementation
    this.registerInterval = vi.fn(this.registerInterval);
  }
}
