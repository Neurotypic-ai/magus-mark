import { Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';

import { DocumentTagService } from './services/DocumentTagService';
import { KeyManager } from './services/KeyManager';
import { TaggingService } from './services/TaggingService';
import { ApiKeyHelpModal } from './ui/ApiKeyHelpModal';
import { FolderTagModal } from './ui/FolderTagModal';
import { TAG_MANAGEMENT_VIEW_TYPE, TagManagementView } from './ui/TagManagementView';
import { TAG_VISUALIZATION_VIEW_TYPE, TagVisualizationView } from './ui/TagVisualizationView';

import type { AIModel } from '@magus-mark/core/models/AIModel';
import type { TagBehavior } from '@magus-mark/core/models/TagBehavior';
import type { App } from 'obsidian';

interface ObsidianMagicSettings {
  apiKey: string;
  apiKeyStorage: 'local' | 'system';
  apiKeyKeychainId: string;
  defaultTagBehavior: TagBehavior;
  enableAutoSync: boolean;
  modelPreference: AIModel;
  showRibbonIcon: boolean;
  statusBarDisplay: 'always' | 'processing' | 'never';
}

export const DEFAULT_SETTINGS: ObsidianMagicSettings = {
  apiKey: '',
  apiKeyStorage: 'local',
  apiKeyKeychainId: '',
  defaultTagBehavior: 'merge',
  enableAutoSync: false,
  modelPreference: 'gpt-4o',
  showRibbonIcon: true,
  statusBarDisplay: 'always',
};
export default class ObsidianMagicPlugin extends Plugin {
  settings: ObsidianMagicSettings = DEFAULT_SETTINGS;
  statusBarElement: HTMLElement | null = null;
  taggingService!: TaggingService;
  documentTagService!: DocumentTagService;
  keyManager!: KeyManager;

  override async onload(): Promise<void> {
    console.log('[Magus Mark] Loading plugin...');

    await this.loadSettings();
    this.keyManager = new KeyManager(this);
    const apiKey = this.keyManager.loadKey();

    try {
      this.taggingService = new TaggingService(this);
      if (apiKey) {
        this.taggingService.updateApiKey(apiKey);
      }
      console.log('[Magus Mark] TaggingService initialized.');
    } catch (error: unknown) {
      console.error('[Magus Mark] Error initializing TaggingService:', error);
      new Notice('Magus Mark: Error initializing TaggingService. Check console.');
    }

    this.documentTagService = new DocumentTagService(this);
    this.addSettingTab(new ObsidianMagicSettingTab(this.app, this));
    this.registerViews();

    if (this.settings.showRibbonIcon) {
      this.addRibbonIcon('tag', 'Magus Mark', async () => {
        await this.activateTagManagementView();
      });
    }

    if (this.settings.statusBarDisplay !== 'never') {
      this.statusBarElement = this.addStatusBarItem();
      this.statusBarElement.createEl('span', { text: 'Magic: Ready' });
      this.statusBarElement.addClass('magus-mark-status');
    }

    this.addCommands();
    this.registerContextMenu();

    this.registerMarkdownPostProcessor((element: HTMLElement, context) => {
      const sourcePath = context.sourcePath;
      if (!sourcePath) {
        // If sourcePath is not available, we cannot reliably process tags contextually.
        return;
      }

      const tagElements = element.querySelectorAll('a.tag');

      for (const tagEl of Array.from(tagElements)) {
        if (!(tagEl instanceof HTMLElement)) continue;

        const tagNameWithHash = tagEl.textContent?.trim();
        if (!tagNameWithHash?.startsWith('#')) continue;

        const tagName = tagNameWithHash.substring(1);

        // Add a marker attribute and class for styling or future interactivity
        tagEl.setAttribute('data-magus-mark-tag', tagName);
        tagEl.classList.add('magus-mark-processed-tag');

        // Example of logging - in a real implementation, you might call a service
        // or directly manipulate the tagEl further based on plugin logic.
        console.log(`[Magus Mark] Processed tag: #${tagName} in file: ${sourcePath}`);

        // Future enhancement placeholder:
        // try {
        //   const tagInfo = await this.documentTagService.getTagInfo(tagName, sourcePath);
        //   if (tagInfo && !tagInfo.isValid) {
        //     tagEl.classList.add('magus-mark-invalid-tag');
        //     tagEl.setAttribute('title', tagInfo.validationMessage || `Tag "${tagName}" is invalid.`);
        //   }
        // } catch (error) {
        //   console.error(`[Magus Mark] Error processing tag #${tagName} in ${sourcePath}:`, error);
        // }
      }
    });
  }

  override onunload(): void {
    console.log('Unloading Magus Mark plugin');
    this.app.workspace.detachLeavesOfType(TAG_MANAGEMENT_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(TAG_VISUALIZATION_VIEW_TYPE);
  }

  async loadSettings(): Promise<void> {
    const data = (await this.loadData()) as Partial<ObsidianMagicSettings> | undefined;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private registerViews(): void {
    this.registerView(TAG_MANAGEMENT_VIEW_TYPE, (leaf) => new TagManagementView(leaf, this));
    this.registerView(TAG_VISUALIZATION_VIEW_TYPE, (leaf) => new TagVisualizationView(leaf, this));
  }

  private addCommands(): void {
    this.addCommand({
      id: 'open-tag-management',
      name: 'Open Tag Management',
      callback: async () => {
        await this.activateTagManagementView();
      },
    });

    this.addCommand({
      id: 'open-tag-visualization',
      name: 'Open Tag Visualization',
      callback: async () => {
        await this.activateTagVisualizationView();
      },
    });

    this.addCommand({
      id: 'tag-current-file',
      name: 'Tag Current File',
      checkCallback: (checking) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          if (!checking) {
            void this.tagCurrentFile();
          }
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id: 'tag-folder',
      name: 'Tag Folder',
      callback: () => {
        this.openFolderTagModal();
      },
    });
  }

  private registerContextMenu(): void {
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile && file.extension === 'md') {
          menu.addItem((item) => {
            item
              .setTitle('Tag with Magus Mark')
              .setIcon('tag')
              .onClick(() => {
                void this.taggingService.processFile(file);
              });
          });
        } else if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle('Tag folder with Magus Mark')
              .setIcon('tag')
              .onClick(() => {
                void this.tagFolder(file);
              });
          });
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        console.log('editor-menu', menu, editor, view);
        menu.addItem((item) => {
          item
            .setTitle('Tag with Magus Mark')
            .setIcon('tag')
            .onClick(() => {
              const file = view.file;
              if (file) {
                void this.taggingService.processFile(file);
              }
            });
        });
      })
    );
  }

  async activateTagManagementView(): Promise<void> {
    const { workspace } = this.app;

    const existingView = workspace.getLeavesOfType(TAG_MANAGEMENT_VIEW_TYPE)[0];
    if (existingView) {
      void workspace.revealLeaf(existingView);
      return;
    }

    const leaf = workspace.getRightLeaf(false);
    if (!leaf) return;

    await leaf.setViewState({
      type: TAG_MANAGEMENT_VIEW_TYPE,
      active: true,
    });

    const newLeaf = workspace.getLeavesOfType(TAG_MANAGEMENT_VIEW_TYPE)[0];
    if (newLeaf) {
      void workspace.revealLeaf(newLeaf);
    }
  }

  async activateTagVisualizationView(): Promise<void> {
    const { workspace } = this.app;

    const existingView = workspace.getLeavesOfType(TAG_VISUALIZATION_VIEW_TYPE)[0];
    if (existingView) {
      void workspace.revealLeaf(existingView);
      return;
    }

    const leaf = workspace.getRightLeaf(false);
    if (!leaf) return;

    await leaf.setViewState({
      type: TAG_VISUALIZATION_VIEW_TYPE,
      active: true,
    });

    const newLeaf = workspace.getLeavesOfType(TAG_VISUALIZATION_VIEW_TYPE)[0];
    if (newLeaf) {
      void workspace.revealLeaf(newLeaf);
    }
  }

  async tagCurrentFile(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;

    await this.taggingService.processFile(activeFile);
  }

  openFolderTagModal(): void {
    const modal = new FolderTagModal(this, (folder, includeSubfolders) => {
      void this.tagFolder(folder, includeSubfolders);
    });
    modal.open();
  }

  async tagFolder(folder: TFolder, includeSubfolders = true): Promise<void> {
    if (this.statusBarElement) {
      this.statusBarElement.setText('Magic: Collecting files...');
    }

    const filesToProcess: TFile[] = [];
    const collectFiles = (currentFolder: TFolder) => {
      currentFolder.children.forEach((child) => {
        if (child instanceof TFile && child.extension === 'md') {
          filesToProcess.push(child);
        } else if (includeSubfolders && child instanceof TFolder) {
          collectFiles(child);
        }
      });
    };
    collectFiles(folder);

    if (filesToProcess.length > 0) {
      if (this.statusBarElement) {
        this.statusBarElement.setText(`Magic: Processing ${String(filesToProcess.length)} files...`);
      }
      await this.taggingService.processFiles(filesToProcess);
    } else {
      if (this.statusBarElement) {
        this.statusBarElement.setText('Magic: No markdown files found');
        setTimeout(() => {
          if (this.statusBarElement) {
            this.statusBarElement.setText('Magic: Ready');
          }
        }, 3000);
      }
    }
    await this.saveSettings();
  }
}

class ObsidianMagicSettingTab extends PluginSettingTab {
  plugin: ObsidianMagicPlugin;

  constructor(app: App, plugin: ObsidianMagicPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Magus Mark Settings' });

    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc('Your OpenAI API key for powering the tagging functionality')
      .addText((text) => {
        text
          .setPlaceholder('sk-...')
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            if (value && !this.plugin.keyManager.validateKey(value)) {
              new Notice('Invalid API key format. OpenAI keys typically start with "sk-"');
              return;
            }

            // Save the key first (don't block on validation)
            await this.plugin.keyManager.saveKey(value);
            this.plugin.taggingService.updateApiKey(value);

            // If there's a value, perform permission validation
            if (value) {
              void this.plugin.keyManager.testApiKey(value).then((result) => {
                if (result.isFail()) {
                  const error = result.getError();

                  // If it's a specific permission issue, give detailed guidance
                  if (error.message.includes('model.request')) {
                    new Notice(
                      '⚠️ Your API key may have insufficient permissions. When using Magus Mark, ensure your key has the "model.request" scope in OpenAI.',
                      10000
                    );
                  }
                }
              });
            }
          });

        text.inputEl.after(
          createEl(
            'button',
            {
              text: 'Test',
              cls: 'mod-cta',
              attr: {
                style: 'margin-left: 8px;',
              },
            },
            (btn) => {
              btn.addEventListener('click', () => {
                (() => {
                  const key = this.plugin.keyManager.loadKey();
                  if (!key) {
                    new Notice('Please enter an API key first');
                    return;
                  }
                  new Notice('Testing API key...');

                  // Use the new testApiKey method to validate permissions
                  void this.plugin.keyManager.testApiKey(key).then((result) => {
                    if (result.isOk()) {
                      new Notice('✅ API key is valid and has all required permissions!');
                    } else {
                      const error = result.getError();
                      // Use HTML entities instead of emoji characters to avoid regex parsing issues
                      new Notice(`\u274C ${error.message}`, 8000);
                    }
                  });
                })();
              });
            }
          )
        );

        // Add help button next to test button
        text.inputEl.after(
          createEl(
            'button',
            {
              text: 'Help',
              attr: {
                style: 'margin-left: 4px;',
                title: 'Get help with API key permissions',
              },
            },
            (btn) => {
              btn.addEventListener('click', () => {
                new ApiKeyHelpModal(this.plugin).open();
              });
            }
          )
        );
      });

    new Setting(containerEl)
      .setName('API Key Storage')
      .setDesc('Choose where to store your API key')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('local', 'Store in Obsidian configuration')
          .addOption('system', 'Store in system keychain')
          .setValue(this.plugin.settings.apiKeyStorage)
          .onChange(async (value) => {
            const oldStorage = this.plugin.settings.apiKeyStorage;
            const newStorage = value as 'local' | 'system';
            if (oldStorage !== newStorage) {
              const currentKey = this.plugin.keyManager.loadKey();
              this.plugin.settings.apiKeyStorage = newStorage;
              await this.plugin.saveSettings();
              if (currentKey) {
                await this.plugin.keyManager.saveKey(currentKey);
                new Notice(`API key migrated to ${newStorage === 'system' ? 'system keychain' : 'local storage'}`);
              }
            }
          })
      );

    new Setting(containerEl)
      .setName('Model Preference')
      .setDesc('Select which OpenAI model to use')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('gpt-4o', 'GPT-4o (Recommended)')
          .addOption('gpt-4', 'GPT-4 (Higher Quality)')
          .addOption('gpt-4-turbo', 'GPT-4 Turbo (Improved)')
          .addOption('gpt-4-vision', 'GPT-4 Vision (With Images)')
          .addOption('gpt-3.5-turbo', 'GPT-3.5 Turbo (Faster/Cheaper)')
          .addOption('gpt-3.5-turbo-instruct', 'GPT-3.5 Turbo Instruct')
          .addOption('davinci-002', 'Davinci-002 (Legacy)')
          .addOption('babbage-002', 'Babbage-002 (Basic Legacy)')
          .setValue(this.plugin.settings.modelPreference)
          .onChange(async (value) => {
            this.plugin.settings.modelPreference = value;
            this.plugin.taggingService.updateModel(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Default Tag Behavior')
      .setDesc('How to handle existing tags when tagging files')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('append', 'Add new tags only')
          .addOption('replace', 'Replace all existing tags')
          .addOption('merge', 'Smart merge of existing and new tags')
          .setValue(this.plugin.settings.defaultTagBehavior)
          .onChange(async (value) => {
            this.plugin.settings.defaultTagBehavior = value as TagBehavior;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Enable Auto-Sync')
      .setDesc('Automatically tag files when they are created or modified')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableAutoSync).onChange(async (value) => {
          this.plugin.settings.enableAutoSync = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Show Ribbon Icon')
      .setDesc('Display the Magus Mark icon in the ribbon')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showRibbonIcon).onChange(async (value) => {
          this.plugin.settings.showRibbonIcon = value;
          await this.plugin.saveSettings();
          new Setting(containerEl)
            .setName('Reload Required')
            .setDesc('Plugin reload required to apply this change')
            .addButton((button) =>
              button
                .setButtonText('Reload Plugin')
                .setCta()
                .onClick(() => {
                  new Notice('Please reload Obsidian to apply changes', 10000);
                })
            );
        })
      );

    new Setting(containerEl)
      .setName('Status Bar Display')
      .setDesc('Control when the status bar element is shown')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('always', 'Always show')
          .addOption('processing', 'Show only when processing')
          .addOption('never', 'Never show')
          .setValue(this.plugin.settings.statusBarDisplay)
          .onChange(async (value) => {
            this.plugin.settings.statusBarDisplay = value as 'always' | 'processing' | 'never';
            await this.plugin.saveSettings();
            if (value === 'never' && this.plugin.statusBarElement) {
              this.plugin.statusBarElement.remove();
              this.plugin.statusBarElement = null;
            } else if (value !== 'never' && !this.plugin.statusBarElement) {
              this.plugin.statusBarElement = this.plugin.addStatusBarItem();
              this.plugin.statusBarElement.setText('Magic: Ready');
              this.plugin.statusBarElement.addClass('magus-mark-status');
            }
          })
      );

    containerEl.createEl('h3', { text: 'Advanced Settings' });
    containerEl.createEl('p', {
      text: 'For more advanced options and documentation, visit the Magus Mark website.',
      cls: 'settings-info',
    });

    const linksContainer = containerEl.createDiv('settings-links');
    const docsLink = linksContainer.createEl('a', {
      text: 'Documentation',
      href: 'https://magus-mark.com/docs',
    });
    docsLink.setAttr('target', '_blank');

    const githubLink = linksContainer.createEl('a', {
      text: 'GitHub Repository',
      href: 'https://github.com/your-github/magus-mark',
    });
    githubLink.setAttr('target', '_blank');
  }
}
