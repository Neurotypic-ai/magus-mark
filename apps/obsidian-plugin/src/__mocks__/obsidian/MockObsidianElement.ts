// Generic mock element type: specific HTMLElement plus Obsidian helpers

export type MockObsidianElement<K extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap> =
  HTMLElementTagNameMap[K] & ObsidianElementExtras;

interface ElementAttrs {
  cls?: string | string[] | undefined;
  text?: string | DocumentFragment | undefined;
  textContent?: string | null;
  type?: string | undefined;
}

// Define Obsidian-specific helpers separately from HTMLElement
export interface ObsidianElementExtras {
  createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs?: ElementAttrs
  ): HTMLElementTagNameMap[K] & ObsidianElementExtras;
  createDiv(attrs?: ElementAttrs): HTMLDivElement & ObsidianElementExtras;
  setText(text: string): void;
  empty(): void;
  addClass(cls: string): void;
  removeClass(cls: string): void;
  setAttr(attr: string, value: string): void;
  doc: Document;
}

// Create a mock element of the given tag, augmented with Obsidian helpers
export function createMockObsidianElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: ElementAttrs
): MockObsidianElement<K> {
  const el = document.createElement(tag) as MockObsidianElement<K>;
  if (attrs) {
    if (attrs.cls) el.className = Array.isArray(attrs.cls) ? attrs.cls.join(' ') : attrs.cls;
    if (attrs.text) el.textContent = typeof attrs.text === 'string' ? attrs.text : (attrs.text.textContent ?? '');
    if (attrs.textContent) el.textContent = attrs.textContent;
  }
  // Attach Obsidian-specific helpers
  el.createEl = vi.fn(
    <L extends keyof HTMLElementTagNameMap>(childTag: L, childAttrs?: ElementAttrs): MockObsidianElement<L> => {
      const childEl = createMockObsidianElement<L>(childTag, childAttrs);
      el.appendChild(childEl);
      return childEl;
    }
  );
  el.createDiv = vi.fn((divAttrs?: ElementAttrs): MockObsidianElement<'div'> => {
    const divEl = createMockObsidianElement('div', divAttrs);
    el.appendChild(divEl);
    return divEl;
  });
  el.setText = vi.fn((text: string) => {
    el.textContent = text;
  });
  el.empty = vi.fn(() => {
    el.innerHTML = '';
  });
  el.addClass = vi.fn();
  el.removeClass = vi.fn();
  el.toggleClass = vi.fn();
  el.setAttr = vi.fn();
  el.doc = document; // Add doc property

  return el;
}
