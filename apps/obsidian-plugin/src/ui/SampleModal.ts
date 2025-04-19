import { Modal } from 'obsidian';

export class SampleModal extends Modal {
  override onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Sample Modal', attr: { tabindex: '0', role: 'heading' } });
    contentEl.setAttr('aria-modal', 'true');
    contentEl.setAttr('role', 'dialog');
    contentEl.focus();
  }
  override onClose(): void {
    this.contentEl.empty();
  }
}
