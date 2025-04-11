import { App, ItemView, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { TagManagementView, TAG_MANAGEMENT_VIEW_TYPE } from './ui/TagManagementView';
import { TaggingService } from './services/TaggingService';
import type { AIModel, TagBehavior } from '@obsidian-magic/types';

interface ObsidianMagicSettings {
  apiKey: string;
  apiKeyStorage: 'local' | 'system';
  defaultTagBehavior: TagBehavior;
  enableAutoSync: boolean;
  modelPreference: AIModel;
  showRibbonIcon: boolean;
  statusBarDisplay: 'always' | 'processing' | 'never';
}

const DEFAULT_SETTINGS: ObsidianMagicSettings = {
  apiKey: '',
  apiKeyStorage: 'local',
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

  override async onload() {
    console.log('Loading Obsidian Magic plugin');
    
    // Load settings
    await this.loadSettings();
    
    // Initialize tagging service
    this.taggingService = new TaggingService(this);
    
    // Register settings tab
    this.addSettingTab(new ObsidianMagicSettingTab(this.app, this));
    
    // Register tag management view
    this.registerView(
      TAG_MANAGEMENT_VIEW_TYPE,
      (leaf) => new TagManagementView(leaf, this)
    );
    
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
  
  override async onunload() {
    console.log('Unloading Obsidian Magic plugin');
    // Clean up views
    this.app.workspace.detachLeavesOfType(TAG_MANAGEMENT_VIEW_TYPE);
  }
  
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  async saveSettings() {
    await this.saveData(this.settings);
  }
  
  private addCommands() {
    // Add tag management command
    this.addCommand({
      id: 'open-tag-management',
      name: 'Open Tag Management',
      callback: async () => {
        await this.activateTagManagementView();
      }
    });
    
    // Add tag current file command
    this.addCommand({
      id: 'tag-current-file',
      name: 'Tag Current File',
      checkCallback: (checking) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          if (!checking) {
            this.tagCurrentFile();
          }
          return true;
        }
        return false;
      }
    });
    
    // Add tag folder command
    this.addCommand({
      id: 'tag-folder',
      name: 'Tag Folder',
      callback: () => {
        // Will implement folder selection modal later
        this.tagFolder();
      }
    });
  }
  
  private registerContextMenu() {
    // Will implement context menu registration
    // This requires additional setup for file explorer context menu items
  }
  
  async activateTagManagementView() {
    const { workspace } = this.app;
    
    // Check if view is already open
    const existingView = workspace.getLeavesOfType(TAG_MANAGEMENT_VIEW_TYPE)[0];
    if (existingView) {
      workspace.revealLeaf(existingView);
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
      workspace.revealLeaf(newLeaf);
    }
  }
  
  async tagCurrentFile() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;
    
    // Process the current file using the tagging service
    await this.taggingService.processFile(activeFile);
  }
  
  async tagFolder() {
    // Will implement folder tagging logic
    console.log('Tag folder functionality to be implemented');
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
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));
    
    // API Key storage location
    new Setting(containerEl)
      .setName('API Key Storage')
      .setDesc('Choose where to store your API key')
      .addDropdown(dropdown => dropdown
        .addOption('local', 'Store in Obsidian configuration')
        .addOption('system', 'Store in system keychain')
        .setValue(this.plugin.settings.apiKeyStorage)
        .onChange(async (value) => {
          this.plugin.settings.apiKeyStorage = value as 'local' | 'system';
          await this.plugin.saveSettings();
        }));
    
    // Model preference
    new Setting(containerEl)
      .setName('Model Preference')
      .setDesc('Select which OpenAI model to use')
      .addDropdown(dropdown => dropdown
        .addOption('gpt-4o', 'GPT-4o (Recommended)')
        .addOption('gpt-3.5-turbo', 'GPT-3.5 Turbo (Faster/Cheaper)')
        .setValue(this.plugin.settings.modelPreference)
        .onChange(async (value) => {
          this.plugin.settings.modelPreference = value as AIModel;
          await this.plugin.saveSettings();
        }));
    
    // Default tag behavior
    new Setting(containerEl)
      .setName('Default Tag Behavior')
      .setDesc('How to handle existing tags when tagging files')
      .addDropdown(dropdown => dropdown
        .addOption('append', 'Add new tags only')
        .addOption('replace', 'Replace all existing tags')
        .addOption('merge', 'Smart merge of existing and new tags')
        .setValue(this.plugin.settings.defaultTagBehavior)
        .onChange(async (value) => {
          this.plugin.settings.defaultTagBehavior = value as TagBehavior;
          await this.plugin.saveSettings();
        }));
    
    // Auto-sync toggle
    new Setting(containerEl)
      .setName('Enable Auto-Sync')
      .setDesc('Automatically tag files when they are created or modified')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableAutoSync)
        .onChange(async (value) => {
          this.plugin.settings.enableAutoSync = value;
          await this.plugin.saveSettings();
        }));
    
    // Ribbon icon toggle
    new Setting(containerEl)
      .setName('Show Ribbon Icon')
      .setDesc('Display the Obsidian Magic icon in the ribbon')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showRibbonIcon)
        .onChange(async (value) => {
          this.plugin.settings.showRibbonIcon = value;
          await this.plugin.saveSettings();
          
          // Force reload required to update ribbon
          new Setting(containerEl)
            .setName('Plugin reload required')
            .setDesc('Toggle changes to the ribbon icon require a plugin reload')
            .addButton(button => button
              .setButtonText('Reload plugin')
              .onClick(async () => {
                await this.plugin.onunload();
                await this.plugin.onload();
              }));
        }));
    
    // Status bar display
    new Setting(containerEl)
      .setName('Status Bar Display')
      .setDesc('Control when the status indicator appears in the bottom bar')
      .addDropdown(dropdown => dropdown
        .addOption('always', 'Always show')
        .addOption('processing', 'Only when processing')
        .addOption('never', 'Never show')
        .setValue(this.plugin.settings.statusBarDisplay)
        .onChange(async (value) => {
          this.plugin.settings.statusBarDisplay = value as 'always' | 'processing' | 'never';
          await this.plugin.saveSettings();
          
          // Update status bar immediately
          if (value === 'never' && this.plugin.statusBarElement) {
            this.plugin.statusBarElement.remove();
            this.plugin.statusBarElement = null;
          } else if (value !== 'never' && !this.plugin.statusBarElement) {
            this.plugin.statusBarElement = this.plugin.addStatusBarItem();
            this.plugin.statusBarElement.setText('Magic: Ready');
            this.plugin.statusBarElement.addClass('obsidian-magic-status');
          }
        }));
  }
}
