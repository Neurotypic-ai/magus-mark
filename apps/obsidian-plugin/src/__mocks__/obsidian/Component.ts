import { vi } from 'vitest';

import { Events } from './MockEvents';

import type { Component as ComponentType, EventRef } from 'obsidian';

export class Component extends Events implements ComponentType {
  load: () => void = vi.fn();
  onload: () => void = vi.fn();
  unload: () => void = vi.fn();
  onunload: () => void = vi.fn();

  addChild: <T extends ComponentType>(child: T) => T = vi.fn(<T extends ComponentType>(child: T): T => {
    return child;
  });

  removeChild: <T extends ComponentType>(child: T) => T = vi.fn(<T extends ComponentType>(child: T): T => {
    return child;
  });

  register: (cb: () => void) => void = vi.fn((cb: () => void): void => {
    console.log('register', cb);
  });

  registerEvent: (eventRef: EventRef) => void = vi.fn((eventRef: EventRef): void => {
    console.log('registerEvent', eventRef);
    // Basic mock: can track refs if needed for testing
  });

  registerDomEvent: {
    <K extends keyof WindowEventMap>(
      el: Window,
      type: K,
      callback: (this: HTMLElement, ev: WindowEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
    <K extends keyof DocumentEventMap>(
      el: Document,
      type: K,
      callback: (this: HTMLElement, ev: DocumentEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
    <K extends keyof HTMLElementEventMap>(
      el: HTMLElement,
      type: K,
      callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
    (
      el: EventTarget,
      type: string,
      callback: (this: HTMLElement, ev: Event) => void,
      options?: boolean | AddEventListenerOptions
    ): void; // General fallback
  } = vi.fn(
    (
      el: Window | Document | HTMLElement | EventTarget,
      type: string,
      callback: (event: Event) => void,
      options?: boolean | AddEventListenerOptions
    ) => {
      if (el instanceof EventTarget) {
        el.addEventListener(type, callback as EventListener, options);
      }
    }
  );

  registerInterval: (id: number) => number = vi.fn();
}
