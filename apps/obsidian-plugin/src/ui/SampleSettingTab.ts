import { App, PluginSettingTab, Setting } from 'obsidian';

export class SampleSettingTab extends PluginSettingTab {
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Settings for my plugin.' });
    new Setting(containerEl)
      .setName('Example setting')
      .setDesc('This is an example setting for accessibility.')
      .addToggle((toggle) => toggle.setValue(false));
  }
}
