import { Events } from './MockEvents';
import { createMockObsidianElement } from './MockObsidianElement';

import type { App as AppType, Modal as ModalType, Scope as ScopeType } from 'obsidian';

import type { MockObsidianElement } from './MockObsidianElement';

// --- Add Minimal Modal Stub --- (From FolderTagModal.test.ts)

export class Modal extends Events implements ModalType {
  app: AppType;
  modalEl: MockObsidianElement<'div'>;
  contentEl: MockObsidianElement<'div'>;
  containerEl: MockObsidianElement<'div'>;
  titleEl: MockObsidianElement<'h2'>;
  scope: ScopeType = {
    register: vi.fn(),
    unregister: vi.fn(),
  }; // Basic scope stub
  shouldRestoreSelection = true; // Default value

  constructor(app: AppType) {
    super();
    this.app = app;
    this.modalEl = createMockObsidianElement<'div'>('div');
    this.modalEl.addClass('modal');
    this.contentEl = this.modalEl.createDiv({ cls: 'modal-content' });
    this.titleEl = this.modalEl.createEl<'h2'>('h2', { cls: 'modal-title' });
    this.containerEl = this.modalEl.createDiv({ cls: 'modal-container' });
  }
  setContent(content: DocumentFragment): this {
    this.contentEl.textContent = content.textContent ?? '';
    return this;
  }
  onOpen: () => void = vi.fn();
  onClose: () => void = vi.fn();
  open(): void {
    document.body.appendChild(this.modalEl);
    this.onOpen();
  }
  close(): void {
    this.modalEl.remove();
    this.onClose();
  }
  setTitle(title: string): this {
    this.titleEl.setText(title);
    return this;
  }
}
