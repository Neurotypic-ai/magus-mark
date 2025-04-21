import { createMockObsidianElement } from '../../testing/createMockObsidianElement';
import { Events } from './MockEvents';

import type { App as AppType, PluginSettingTab as PluginSettingTabType, Plugin as PluginType } from 'obsidian';

import type { MockObsidianElement } from './MockObsidianElement';

/** Minimal PluginSettingTab base class stub */

export class PluginSettingTab extends Events implements PluginSettingTabType {
  app: AppType;
  plugin: PluginType;
  containerEl: MockObsidianElement<'div'>;
  constructor(app: AppType, plugin: PluginType) {
    super();

    this.app = app;
    this.plugin = plugin;
    this.containerEl = createMockObsidianElement<'div'>('div'); // Use helper
  }
  display(): void {
    /* no-op for mock */
  }
  hide(): void {
    /* no-op for mock */
  }
}
