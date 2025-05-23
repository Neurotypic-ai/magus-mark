export interface ElementAttrs {
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
  createSpan(attrs?: ElementAttrs): HTMLSpanElement & ObsidianElementExtras;
  createPara(attrs?: ElementAttrs): HTMLParagraphElement & ObsidianElementExtras;
  setText(text: string): void;
  empty(): void;
  addClass(cls: string): void;
  removeClass(cls: string): void;
  toggleClass(cls: string, value?: boolean): void;
  setAttr(attr: string, value: string): void;
  doc: Document;
}

// Generic mock element type: specific HTMLElement plus Obsidian helpers
export type MockObsidianElement<K extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap> =
  HTMLElementTagNameMap[K] & ObsidianElementExtras;
