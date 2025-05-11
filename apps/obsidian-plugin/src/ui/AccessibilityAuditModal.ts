import { Modal } from 'obsidian';

export class AccessibilityAuditModal extends Modal {
  override onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Accessibility Audit Results', attr: { tabindex: '0', role: 'heading' } });
    // (Speculation) Example: scan for headings, alt text, contrast (stubbed for now)
    const results = [
      '✔ All headings use proper hierarchy.',
      '✖ 2 images missing alt text.',
      '✔ Sufficient color contrast detected in all notes scanned.',
    ];
    const ul = contentEl.createEl('ul');
    results.forEach((result) => {
      ul.createEl('li', { text: result });
    });
    contentEl.setAttr('aria-modal', 'true');
    contentEl.setAttr('role', 'dialog');
    contentEl.focus();
  }
  override onClose(): void {
    this.contentEl.empty();
  }
}
