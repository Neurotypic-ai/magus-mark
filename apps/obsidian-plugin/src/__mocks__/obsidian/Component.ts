import { vi } from 'vitest';

import { Events } from './MockEvents';

import type { Component as ComponentType, EventRef } from 'obsidian';

export class Component extends Events implements ComponentType {
  // Make these real methods that can be properly overridden
  load(): void {
    // Default no-op implementation
  }

  onload(): void {
    // Default no-op implementation - this will be overridden by child classes
  }

  unload(): void {
    // Default no-op implementation
  }

  onunload(): void {
    // Default no-op implementation - this will be overridden by child classes
  }

  // Methods defined by ComponentType should be actual methods here
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
  }

  // registerDomEvent with overloads
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
    _el: EventTarget, // Base implementation signature
    _type: string,
    _callback: (this: HTMLElement, ev: Event) => any,
    _options?: boolean | AddEventListenerOptions
  ): void {
    // console.log('MockComponent.registerDomEvent implementation called');
  }

  registerInterval(_id: number): number {
    // console.log('MockComponent.registerInterval called');
    return 0; // Return a number as per Obsidian API
  }

  containerEl!: HTMLElement;

  constructor() {
    super();
    // Wrap methods with vi.fn() to make instance methods mockable
    this.addChild = vi.fn(this.addChild);
    this.removeChild = vi.fn(this.removeChild);
    this.register = vi.fn(this.register);
    this.registerEvent = vi.fn(this.registerEvent);
    this.registerDomEvent = vi.fn(this.registerDomEvent) as any; // Cast for overload handling
    this.registerInterval = vi.fn(this.registerInterval);
  }
}
