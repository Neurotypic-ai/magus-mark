import { Modal } from 'obsidian';

import type MagusMarkPlugin from '../main';

/**
 * Modal dialog that explains how to fix OpenAI API key permission issues
 */
export class ApiKeyHelpModal extends Modal {
  constructor(plugin: MagusMarkPlugin) {
    super(plugin.app);
  }

  override onOpen(): void {
    const { contentEl } = this;

    // Add modal title
    contentEl.createEl('h2', { text: 'OpenAI API Key Permissions Help' });

    // Create the main content container
    const container = contentEl.createDiv({ cls: 'api-key-help-container' });

    // Explanation section
    const explanationDiv = container.createDiv({ cls: 'api-key-help-section' });
    explanationDiv.createEl('h3', { text: 'The Issue' });
    explanationDiv.createEl('p', {
      text: 'Your OpenAI API key is missing the required "model.request" scope. This is necessary for Magus Mark to analyze your notes.',
    });

    // Steps to fix section
    const stepsDiv = container.createDiv({ cls: 'api-key-help-section' });
    stepsDiv.createEl('h3', { text: 'How to Fix It' });
    const stepsList = stepsDiv.createEl('ol');

    stepsList.createEl('li', {
      text: 'Go to the OpenAI website and log in to your account: https://platform.openai.com/',
    });
    stepsList.createEl('li', { text: 'Navigate to API Keys: https://platform.openai.com/api-keys' });
    stepsList.createEl('li', { text: 'Click "Create new secret key"' });
    stepsList.createEl('li', {
      text: 'Give your key a name (e.g., "Magus Mark") and ensure it has the necessary permissions:',
    });

    // Sub-steps for permissions
    const permissionList = stepsList.createEl('ul');
    permissionList.createEl('li', {
      text: 'If using "Organization settings", ensure your role is Writer or Owner',
    });
    permissionList.createEl('li', {
      text: 'If using a restricted key, make sure to include the "model.request" scope',
    });

    stepsList.createEl('li', { text: 'Copy your new API key' });
    stepsList.createEl('li', { text: 'Paste it in the Magus Mark settings' });
    stepsList.createEl('li', { text: 'Click the "Test" button to verify permissions' });

    // Additional information section
    const infoDiv = container.createDiv({ cls: 'api-key-help-section' });
    infoDiv.createEl('h3', { text: 'Additional Information' });
    infoDiv.createEl('p', {
      text: 'OpenAI recently changed their permissions model to use scoped API keys. Older keys may not have the required scopes.',
    });
    infoDiv.createEl('p', {
      text: 'For more information, see the OpenAI documentation: https://platform.openai.com/docs/guides/authentication',
    });

    // Add a close button
    const buttonDiv = container.createDiv({ cls: 'api-key-help-buttons' });
    buttonDiv.createEl('button', { text: 'Close' }).addEventListener('click', () => {
      this.close();
    });

    // Add some basic styles
    contentEl.createEl('style', {
      text: `
        .api-key-help-container {
          padding: 0 16px;
          max-width: 600px;
        }
        .api-key-help-section {
          margin-bottom: 24px;
        }
        .api-key-help-buttons {
          display: flex;
          justify-content: flex-end;
          margin-top: 16px;
        }
        .api-key-help-buttons button {
          padding: 8px 16px;
        }
      `,
    });
  }

  override onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
