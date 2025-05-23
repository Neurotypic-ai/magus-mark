import { vi } from 'vitest';

import type { MockObsidianElement } from '../__mocks__/obsidian/MockObsidianElement';

// Types for mock collections
interface MockClassList {
  _classes: Set<string>;
  add: (className: string) => void;
  remove: (className: string) => void;
  contains: (className: string) => boolean;
  toggle: (className: string) => boolean;
  toString: () => string;
}

interface MockNamedNodeMap extends Map<string, string> {
  readonly length: number;
  item: (index: number) => { name: string; value: string } | null;
  getNamedItem: (name: string) => { name: string; value: string } | null;
  setNamedItem: () => void;
  removeNamedItem: () => void;
}

interface MockHTMLCollection extends Array<MockObsidianElement> {
  readonly length: number;
  item: (index: number) => MockObsidianElement | null;
  namedItem: (name: string) => MockObsidianElement | null;
}

interface MockNodeList extends Array<MockObsidianElement> {
  readonly length: number;
  item: (index: number) => MockObsidianElement | null;
  forEach: (
    callbackfn: (value: MockObsidianElement, index: number, array: MockObsidianElement[]) => void,
    thisArg?: unknown
  ) => void;
}

// Enhanced mock element factory that properly simulates DOM behavior
export function createMockObsidianElement<T extends keyof HTMLElementTagNameMap>(
  tagName: T,
  options?: { cls?: string; text?: string; type?: string; [key: string]: unknown }
): MockObsidianElement<T> {
  // Create mock collections as variables to avoid casting issues
  const mockChildren = Object.assign([], {
    length: 0,
    item: vi.fn(function (this: MockHTMLCollection, index: number) {
      return this[index] ?? null;
    }),
    namedItem: vi.fn(function (this: MockHTMLCollection, _name: string) {
      console.log('namedItem called with:', _name);
      return null;
    }),
  }) as MockHTMLCollection;

  const mockChildNodes = Object.assign([], {
    length: 0,
    item: vi.fn(function (this: MockNodeList, index: number) {
      return this[index] ?? null;
    }),
    forEach: vi.fn(function (
      this: MockNodeList,
      callbackfn: (value: MockObsidianElement, index: number, array: MockObsidianElement[]) => void,
      thisArg?: unknown
    ) {
      Array.prototype.forEach.call(this, callbackfn, thisArg);
    }),
  }) as MockNodeList;

  const mockAttributes = (() => {
    const map = new Map<string, string>();
    return Object.assign(map, {
      get length(): number {
        return map.size;
      },
      item: vi.fn(function (this: MockNamedNodeMap, index: number) {
        const entries = Array.from(map.entries());
        return entries[index] ? { name: entries[index][0], value: entries[index][1] } : null;
      }),
      getNamedItem: vi.fn(function (this: MockNamedNodeMap, name: string) {
        const value = map.get(name);
        return value ? { name, value } : null;
      }),
      setNamedItem: vi.fn(),
      removeNamedItem: vi.fn(),
    }) as MockNamedNodeMap;
  })();

  const element = {
    tagName: tagName.toUpperCase(),
    textContent: options?.text ?? '',
    innerHTML: options?.text ?? '',
    value: '',
    checked: false,
    disabled: false,
    type: options?.type ?? '',
    id: '',

    // Mock DOM collections with proper interfaces
    style: {
      _styles: {} as Record<string, string>,
      get display() {
        return this._styles['display'] ?? '';
      },
      set display(value: string) {
        this._styles['display'] = value;
      },
      visibility: '',
      opacity: '',
      getPropertyValue: vi.fn((prop: string) => {
        console.log('getPropertyValue called with:', prop);
        return '';
      }),
      setProperty: vi.fn(),
    },

    classList: {
      _classes: new Set<string>(),
      add: vi.fn(function (this: MockClassList, className: string) {
        this._classes.add(className);
      }),
      remove: vi.fn(function (this: MockClassList, className: string) {
        this._classes.delete(className);
      }),
      contains: vi.fn(function (this: MockClassList, className: string) {
        return this._classes.has(className);
      }),
      toggle: vi.fn(function (this: MockClassList, className: string) {
        if (this._classes.has(className)) {
          this._classes.delete(className);
          return false;
        } else {
          this._classes.add(className);
          return true;
        }
      }),
      toString: vi.fn(function (this: MockClassList) {
        return Array.from(this._classes).join(' ');
      }),
    } as MockClassList,

    dataset: {},

    // Use the mock collections directly
    attributes: mockAttributes,
    children: mockChildren,
    childNodes: mockChildNodes,

    parentNode: null,
    parentElement: null,

    // Enhanced Obsidian-specific methods
    createEl: vi.fn(
      (childTagName: string, childOptions?: { cls?: string; text?: string; type?: string; [key: string]: unknown }) => {
        const child = createMockObsidianElement(childTagName as keyof HTMLElementTagNameMap, childOptions);
        mockChildren.push(child);
        mockChildNodes.push(child);
        (
          child as MockObsidianElement & {
            parentNode: MockObsidianElement<T> | null;
            parentElement: MockObsidianElement<T> | null;
          }
        ).parentNode = element;
        (
          child as MockObsidianElement & {
            parentNode: MockObsidianElement<T> | null;
            parentElement: MockObsidianElement<T> | null;
          }
        ).parentElement = element;
        return child;
      }
    ),

    createDiv: vi.fn((options?: { cls?: string; text?: string; [key: string]: unknown }) =>
      element.createEl('div', options)
    ),
    createSpan: vi.fn((options?: { cls?: string; text?: string; [key: string]: unknown }) =>
      element.createEl('span', options)
    ),
    createPara: vi.fn((options?: { cls?: string; text?: string; [key: string]: unknown }) =>
      element.createEl('p', options)
    ),

    setText: vi.fn((text: string) => {
      element.textContent = text;
      element.innerHTML = text;
      return element;
    }),

    empty: vi.fn(() => {
      mockChildren.splice(0);
      mockChildNodes.splice(0);
      element.innerHTML = '';
      element.textContent = '';
      return element;
    }),

    addClass: vi.fn((className: string) => {
      element.classList.add(className);
      return element;
    }),

    removeClass: vi.fn((className: string) => {
      element.classList.remove(className);
      return element;
    }),

    toggleClass: vi.fn((className: string) => {
      element.classList.toggle(className);
      return element;
    }),

    setAttr: vi.fn((name: string, value: string) => {
      mockAttributes.set(name, value);
      if (name === 'id') element.id = value;
      if (name === 'type') (element as MockObsidianElement<T> & { type: string }).type = value;
      return element;
    }),

    getAttr: vi.fn((name: string) => {
      return mockAttributes.get(name) ?? '';
    }),

    removeAttr: vi.fn((name: string) => {
      mockAttributes.delete(name);
      return element;
    }),

    appendChild: vi.fn((child: MockObsidianElement) => {
      mockChildren.push(child);
      mockChildNodes.push(child);
      (
        child as MockObsidianElement & {
          parentNode: MockObsidianElement<T> | null;
          parentElement: MockObsidianElement<T> | null;
        }
      ).parentNode = element;
      (
        child as MockObsidianElement & {
          parentNode: MockObsidianElement<T> | null;
          parentElement: MockObsidianElement<T> | null;
        }
      ).parentElement = element;
      return child;
    }),

    removeChild: vi.fn((child: MockObsidianElement) => {
      const index = mockChildren.indexOf(child);
      if (index > -1) {
        mockChildren.splice(index, 1);
        mockChildNodes.splice(index, 1);
        (
          child as MockObsidianElement & {
            parentNode: MockObsidianElement<T> | null;
            parentElement: MockObsidianElement<T> | null;
          }
        ).parentNode = null;
        (
          child as MockObsidianElement & {
            parentNode: MockObsidianElement<T> | null;
            parentElement: MockObsidianElement<T> | null;
          }
        ).parentElement = null;
      }
      return child;
    }),

    querySelector: vi.fn((selector: string) => {
      // Simple mock implementation for common selectors
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        return mockChildren.find((child) => child.classList.contains(className)) ?? null;
      }
      if (selector.startsWith('#')) {
        const id = selector.slice(1);
        return mockChildren.find((child) => child.id === id) ?? null;
      }
      return (
        mockChildren.find((child) => child.tagName && child.tagName.toLowerCase() === selector.toLowerCase()) ?? null
      );
    }),

    querySelectorAll: vi.fn((selector: string) => {
      // Simple mock implementation
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        return mockChildren.filter((child) => child.classList.contains(className));
      }
      return mockChildren.filter((child) => child.tagName && child.tagName.toLowerCase() === selector.toLowerCase());
    }),

    // Standard DOM event methods
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),

    // Standard DOM properties
    get firstChild() {
      return mockChildren[0] ?? null;
    },
    get lastChild() {
      return mockChildren[mockChildren.length - 1] ?? null;
    },
    get childElementCount() {
      return mockChildren.length;
    },

    // Document reference
    doc: {
      createElement: vi.fn((tag: string) => createMockObsidianElement(tag as keyof HTMLElementTagNameMap)),
      createDocumentFragment: vi.fn(() => ({ childNodes: [], appendChild: vi.fn() })),
      location: { href: 'mock://obsidian' },
      defaultView: {
        getComputedStyle: vi.fn(() => ({})),
      },
    },
  } as unknown as MockObsidianElement<T>;

  // Apply initial classes if provided
  if (options?.cls) {
    element.classList.add(options.cls);
  }

  // Apply any additional properties
  Object.keys(options ?? {}).forEach((key) => {
    if (key !== 'cls' && key !== 'text' && key !== 'type') {
      (element as Record<string, unknown>)[key] = options?.[key];
    }
  });

  return element;
}
