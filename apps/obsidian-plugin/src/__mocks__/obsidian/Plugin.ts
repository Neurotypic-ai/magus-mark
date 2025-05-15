import { vi } from 'vitest';

import { createMockObsidianElement } from '../../testing/createMockObsidianElement';
import { Component } from './Component';

import type {
  App,
  Command,
  Component as ComponentType,
  EditorSuggest,
  EventRef,
  HoverLinkSource,
  MarkdownPostProcessor,
  MarkdownPostProcessorContext,
  PluginManifest as PluginManifestType,
  Plugin as PluginType,
} from 'obsidian';

import type { MockObsidianElement } from './MockObsidianElement';

export class Plugin extends Component implements PluginType {
  app: App;
  manifest: PluginManifestType;
  constructor(app: App, manifest: PluginManifestType) {
    super();
    this.app = app;
    this.app.vault = this.app.vault;
    this.app.workspace = this.app.workspace;
    this.app.metadataCache = this.app.metadataCache;
    this.manifest = manifest;
  }
  addCommand(command: Command): Command {
    console.log('addCommand', command);
    return command;
  }
  registerView(): void {
    /* no-op for mock */
  }
  addSettingTab(): void {
    /* no-op for mock */
  }
  loadData(): Promise<Record<string, unknown>> {
    return Promise.resolve({});
  }
  saveData(): Promise<void> {
    return Promise.resolve();
  }
  addRibbonIcon(): MockObsidianElement<'div'> {
    return createMockObsidianElement<'div'>('div');
  }
  addStatusBarItem(): MockObsidianElement<'div'> {
    const el = createMockObsidianElement<'div'>('div');
    // Spy on setText and addClass to preserve default behavior and enable assertions
    vi.spyOn(el, 'setText');
    vi.spyOn(el, 'addClass');
    return el;
  }
  registerEditorExtension(extension: unknown): void {
    console.log('registerEditorExtension', extension);
    /* no-op for mock */
  }
  removeCommand(commandId: string): void {
    console.log('removeCommand', commandId);
    /* no-op for mock */
  }
  unregisterEvent: (event: string, callback: () => void) => void = vi.fn(
    (event: string, callback: () => void): void => {
      console.log('unregisterEvent', event, callback);
      /* no-op for mock */
    }
  );
  registerHoverLinkSource: (id: string, source: HoverLinkSource) => void = vi.fn(
    (id: string, source: HoverLinkSource): void => {
      console.log('registerHoverLinkSource', id, source);
      /* no-op for mock */
    }
  );
  registerExtensions: (extensions: unknown[]) => void = vi.fn((extensions: unknown[]): void => {
    console.log('registerExtensions', extensions);
    /* no-op for mock */
  });
  registerMarkdownPostProcessor: (processor: MarkdownPostProcessor, sortOrder?: number) => MarkdownPostProcessor =
    vi.fn((processor: MarkdownPostProcessor, sortOrder?: number): MarkdownPostProcessor => {
      console.log('registerMarkdownPostProcessor', processor, sortOrder);
      /* no-op for mock */
      return processor;
    });
  registerMarkdownCodeBlockProcessor: (
    language: string,
    handler: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => void | Promise<any>,
    sortOrder?: number
  ) => MarkdownPostProcessor = vi.fn(
    (
      language: string,
      handler: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => void | Promise<any>,
      sortOrder?: number
    ): MarkdownPostProcessor => {
      console.log('registerMarkdownCodeBlockProcessor', language, handler, sortOrder);
      /* no-op for mock */
      return handler as unknown as MarkdownPostProcessor;
    }
  );

  // Add missing methods required by PluginType interface
  registerObsidianProtocolHandler(
    action: string,
    handler: (params: { action: string; [key: string]: string }) => any
  ): void {
    console.log('registerObsidianProtocolHandler', action, handler);
    /* no-op for mock */
  }

  registerEditorSuggest(suggest: EditorSuggest<any>): void {
    console.log('registerEditorSuggest', suggest);
    /* no-op for mock */
  }

  onUserEnable(): void {
    console.log('onUserEnable called');
    /* no-op for mock */
  }

  // Add missing methods from Component lifecycle expected by PluginType
  override removeChild<T extends ComponentType>(_component: T): T {
    return _component; // Mock implementation
  }

  override register(_cb: () => any): void {
    /* no-op for mock */
  }

  override registerEvent(_eventRef: EventRef): void {
    /* no-op for mock */
  }

  override registerDomEvent<K extends keyof WindowEventMap>(
    _el: Window | Document | HTMLElement,
    _type: K,
    _callback: (this: HTMLElement, ev: WindowEventMap[K]) => any,
    _options?: boolean | AddEventListenerOptions
  ): void {
    /* no-op for mock */
  }

  override registerInterval(_id: number): number {
    return _id; // Mock implementation, typically you'd store and clear it
  }
}
