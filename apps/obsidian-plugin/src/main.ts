import { Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';

import { DocumentTagService } from './services/DocumentTagService';
import { KeyManager } from './services/KeyManager';
import { TaggingService } from './services/TaggingService';
import { FolderTagModal } from './ui/FolderTagModal';
import { TAG_MANAGEMENT_VIEW_TYPE, TagManagementView } from './ui/TagManagementView';
import { TAG_VISUALIZATION_VIEW_TYPE, TagVisualizationView } from './ui/TagVisualizationView';

import type { AIModel, TagBehavior } from '@obsidian-magic/types';
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

const DEFAULT_SETTINGS: ObsidianMagicSettings = {
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

  override async onload() {
    console.log('Loading Obsidian Magic plugin');

    // Load settings
    await this.loadSettings();

    // Initialize key manager
    this.keyManager = new KeyManager(this);

    // Retrieve API key from secure storage
    const apiKey = await this.keyManager.loadKey();

    // Initialize tagging service with the retrieved key
    this.taggingService = new TaggingService(this);
    if (apiKey) {
      this.taggingService.updateApiKey(apiKey);
    }

    // Initialize document tag service
    this.documentTagService = new DocumentTagService(this);

    // Register settings tab
    this.addSettingTab(new ObsidianMagicSettingTab(this.app, this));

    // Register views
    this.registerViews();

    // Register ribbon icon if enabled
    if (this.settings.showRibbonIcon) {
      this.addRibbonIcon('tag', 'Obsidian Magic', async () => {
        await this.activateTagManagementView();
      });
    }

    // Register status bar element if enabled
    if (this.settings.statusBarDisplay !== 'never') {
      this.statusBarElement = this.addStatusBarItem();
      this.statusBarElement.setText('Magic: Ready');
      this.statusBarElement.addClass('obsidian-magic-status');
    }

    // Register commands
    this.addCommands();

    // Register context menu
    this.registerContextMenu();
  }

  override onunload() {
    console.log('Unloading Obsidian Magic plugin');
    // Clean up views
    this.app.workspace.detachLeavesOfType(TAG_MANAGEMENT_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(TAG_VISUALIZATION_VIEW_TYPE);
  }

  async loadSettings() {
    const data = (await this.loadData()) as Partial<ObsidianMagicSettings> | undefined;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private registerViews() {
    // Register tag management view
    this.registerView(TAG_MANAGEMENT_VIEW_TYPE, (leaf) => new TagManagementView(leaf, this));

    // Register tag visualization view
    this.registerView(TAG_VISUALIZATION_VIEW_TYPE, (leaf) => new TagVisualizationView(leaf, this));
  }

  private addCommands() {
    // Add tag management command
    this.addCommand({
      id: 'open-tag-management',
      name: 'Open Tag Management',
      callback: async () => {
        await this.activateTagManagementView();
      },
    });

    // Add tag visualization command
    this.addCommand({
      id: 'open-tag-visualization',
      name: 'Open Tag Visualization',
      callback: async () => {
        await this.activateTagVisualizationView();
      },
    });

    // Add tag current file command
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

    // Add tag folder command
    this.addCommand({
      id: 'tag-folder',
      name: 'Tag Folder',
      callback: () => {
        this.openFolderTagModal();
      },
    });
  }

  private registerContextMenu() {
    // Add file explorer context menu items
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile && file.extension === 'md') {
          menu.addItem((item) => {
            item
              .setTitle('Tag with Obsidian Magic')
              .setIcon('tag')
              .onClick(() => {
                void this.taggingService.processFile(file);
              });
          });
        } else if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle('Tag folder with Obsidian Magic')
              .setIcon('tag')
              .onClick(() => {
                void this.tagFolder(file);
              });
          });
        }
      })
    );

    // Add editor context menu item
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        menu.addItem((item) => {
          item
            .setTitle('Tag with Obsidian Magic')
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

  async activateTagManagementView() {
    const { workspace } = this.app;

    // Check if view is already open
    const existingView = workspace.getLeavesOfType(TAG_MANAGEMENT_VIEW_TYPE)[0];
    if (existingView) {
      void workspace.revealLeaf(existingView);
      return;
    }

    // Open view in right sidebar by default
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

  async activateTagVisualizationView() {
    const { workspace } = this.app;

    // Check if view is already open
    const existingView = workspace.getLeavesOfType(TAG_VISUALIZATION_VIEW_TYPE)[0];
    if (existingView) {
      void workspace.revealLeaf(existingView);
      return;
    }

    // Open view in right sidebar by default
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

  async tagCurrentFile() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;

    // Process the current file using the tagging service
    await this.taggingService.processFile(activeFile);
  }

  openFolderTagModal() {
    const modal = new FolderTagModal(this, (folder, includeSubfolders) => {
      void this.tagFolder(folder, includeSubfolders);
    });
    modal.open();
  }

  async tagFolder(folder: TFolder, includeSubfolders = true) {
    // Update status
    if (this.statusBarElement) {
      this.statusBarElement.setText('Magic: Collecting files...');
    }

    // Collect files to process
    const filesToProcess: TFile[] = [];

    // Helper function to collect files recursively
    const collectFiles = (currentFolder: TFolder) => {
      currentFolder.children.forEach((child) => {
        if (child instanceof TFile && child.extension === 'md') {
          filesToProcess.push(child);
        } else if (includeSubfolders && child instanceof TFolder) {
          collectFiles(child);
        }
      });
    };

    // Start collecting files
    collectFiles(folder);

    // Process files
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

    // Update the key manager's storage strategy - we don't need this line
    // simply saving the settings is sufficient
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

    containerEl.createEl('h2', { text: 'Obsidian Magic Settings' });

    // API Key settings
    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc('Your OpenAI API key for powering the tagging functionality')
      .addText((text) => {
        text
          .setPlaceholder('sk-...')
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            // Only validate and save if the key format is valid
            if (value && !this.plugin.keyManager.validateKey(value)) {
              new Notice('Invalid API key format. OpenAI keys typically start with "sk-"');
              return;
            }

            // Save the key using the key manager
            await this.plugin.keyManager.saveKey(value);

            // Update the tagging service with the new key
            this.plugin.taggingService.updateApiKey(value);
          });

        // Add test button
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
                void (async () => {
                  const key = await this.plugin.keyManager.loadKey();

                  if (!key) {
                    new Notice('Please enter an API key first');
                    return;
                  }

                  new Notice('Testing API key...');

                  // Use validateKey as a substitute for verifyKey since we need to verify
                  // We could implement a more robust check with a network call, but for now
                  // we'll use validateKey for format verification
                  const isValid = this.plugin.keyManager.validateKey(key);

                  if (isValid) {
                    new Notice('API key is valid!');
                  } else {
                    new Notice('API key is invalid or could not connect to OpenAI');
                  }
                })();
              });
            }
          )
        );
      });

    // API Key storage location
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
              // Get the current key
              const currentKey = await this.plugin.keyManager.loadKey();

              // Update the storage setting
              this.plugin.settings.apiKeyStorage = newStorage;
              await this.plugin.saveSettings();

              // If we have a key, migrate it to the new storage
              if (currentKey) {
                await this.plugin.keyManager.saveKey(currentKey);
                new Notice(`API key migrated to ${newStorage === 'system' ? 'system keychain' : 'local storage'}`);
              }
            }
          })
      );

    // Model preference
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

    // Default tag behavior
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

    // Auto-sync toggle
    new Setting(containerEl)
      .setName('Enable Auto-Sync')
      .setDesc('Automatically tag files when they are created or modified')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableAutoSync).onChange(async (value) => {
          this.plugin.settings.enableAutoSync = value;
          await this.plugin.saveSettings();
        })
      );

    // Ribbon icon toggle
    new Setting(containerEl)
      .setName('Show Ribbon Icon')
      .setDesc('Display the Obsidian Magic icon in the ribbon')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showRibbonIcon).onChange(async (value) => {
          this.plugin.settings.showRibbonIcon = value;
          await this.plugin.saveSettings();

          // Require reload
          new Setting(containerEl)
            .setName('Reload Required')
            .setDesc('Plugin reload required to apply this change')
            .addButton((button) =>
              button
                .setButtonText('Reload Plugin')
                .setCta()
                .onClick(() => {
                  // Reload the plugin - require user to manually reload
                  new Notice('Please reload Obsidian to apply changes', 10000);
                  // Obsidian will handle plugin reloading on app restart
                })
            );
        })
      );

    // Status bar display
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

            // Update status bar visibility
            if (value === 'never' && this.plugin.statusBarElement) {
              this.plugin.statusBarElement.remove();
              this.plugin.statusBarElement = null;
            } else if (value !== 'never' && !this.plugin.statusBarElement) {
              this.plugin.statusBarElement = this.plugin.addStatusBarItem();
              this.plugin.statusBarElement.setText('Magic: Ready');
              this.plugin.statusBarElement.addClass('obsidian-magic-status');
            }
          })
      );

    // Add advanced settings section
    containerEl.createEl('h3', { text: 'Advanced Settings' });

    // Add links to documentation
    containerEl.createEl('p', {
      text: 'For more advanced options and documentation, visit the Obsidian Magic website.',
      cls: 'settings-info',
    });

    const linksContainer = containerEl.createDiv('settings-links');

    // Add documentation link
    const docsLink = linksContainer.createEl('a', {
      text: 'Documentation',
      href: 'https://obsidian-magic.com/docs',
    });
    docsLink.setAttr('target', '_blank');

    // Add GitHub link
    const githubLink = linksContainer.createEl('a', {
      text: 'GitHub Repository',
      href: 'https://github.com/your-github/obsidian-magic',
    });
    githubLink.setAttr('target', '_blank');
  }
}
