import { vi } from 'vitest';

import { createMockObsidianElement } from '../../testing/createMockObsidianElement';
import { Events } from './MockEvents';

import type { MockObsidianElement } from './MockObsidianElement';

// Simple type definitions to avoid circular imports
interface App {
  [key: string]: any;
}

interface Scope {
  register: any;
  unregister: any;
}

interface ModalType {
  app: App;
  modalEl: any;
  contentEl: any;
  containerEl: any;
  scope: Scope;
  shouldRestoreSelection?: boolean;
  open(): void;
  close(): void;
  onOpen(): void;
  onClose(): void;
  setTitle(title: string): this;
  setContent(content: DocumentFragment): this;
}

/**
 * Modal mock implementation for testing
 * This follows Vitest's best practices for class mocks
 */
export class Modal extends Events implements ModalType {
  app: App;
  modalEl: MockObsidianElement<'div'>;
  contentEl: MockObsidianElement<'div'>;
  containerEl: MockObsidianElement<'div'>;
  titleEl: MockObsidianElement<'h2'>;
  scope: Scope;
  shouldRestoreSelection = true;

  constructor(app: App) {
    super();
    this.app = app;
    this.modalEl = createMockObsidianElement<'div'>('div');
    this.modalEl.addClass('modal');
    this.contentEl = this.modalEl.createDiv({ cls: 'modal-content' });
    this.titleEl = this.modalEl.createEl<'h2'>('h2', { cls: 'modal-title' });
    this.containerEl = this.modalEl.createDiv({ cls: 'modal-container' });
    this.scope = {
      register: vi.fn(),
      unregister: vi.fn(),
    };

    // Create spy methods for easier testing
    this.open = vi.fn(this.open.bind(this));
    this.close = vi.fn(this.close.bind(this));
    this.setTitle = vi.fn(this.setTitle.bind(this));
    this.setContent = vi.fn(this.setContent.bind(this));
  }

  // Define as methods rather than properties
  open(): void {
    if (typeof document !== 'undefined') {
      document.body.appendChild(this.modalEl);
    }
    this.onOpen();
  }

  close(): void {
    this.modalEl.remove();
    this.onClose();
  }

  onOpen(): void {
    // Default implementation
  }

  onClose(): void {
    // Default implementation
  }

  setTitle(title: string): this {
    this.titleEl.setText(title);
    return this;
  }

  setContent(content: DocumentFragment): this {
    this.contentEl.textContent = content.textContent ?? '';
    return this;
  }
}

// Export default for direct imports
export default Modal;
