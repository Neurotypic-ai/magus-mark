import { TFile, TFolder } from 'obsidian';

import { DataAdapter } from './DataAdapter';
import { createMockMarkdownFiles, createMockTFile, createMockTFolder } from './FileMockHelpers';
import { Events } from './MockEvents';

import type { TAbstractFile, Vault as VaultType } from 'obsidian';

/**
 * Minimal Vault stub with getMarkdownFiles returning mock files by default.
 * @example
 *   const vault = new Vault();
 *   const files = vault.getMarkdownFiles();
 */

export class Vault extends Events implements VaultType {
  configDir = '.obsidian';
  adapter: DataAdapter = new DataAdapter();

  getName(): string {
    return 'MockVault';
  }
  getFileByPath(): TFile | null {
    return null;
  }
  getFolderByPath(): TFolder | null {
    return null;
  }
  getAbstractFileByPath(path: string): TFile | TFolder | null {
    if (path.endsWith('.md')) {
      return createMockTFile(path.split('/').pop() ?? '', path);
    }
    if (!path.includes('.') || /\.\w+$/.exec(path) === null || !['md'].includes(path.split('.').pop() ?? '')) {
      return createMockTFolder(path.split('/').pop() ?? '', 0, 'folder');
    }
    return null;
  }
  getRoot(): TFolder {
    return createMockTFolder('/');
  }
  create(): Promise<TFile> {
    return Promise.resolve(createMockTFile('new_file.md', ''));
  }
  createBinary(): Promise<TFile> {
    return Promise.resolve(createMockTFile('new_file.md', ''));
  }
  createFolder(): Promise<TFolder> {
    return Promise.resolve(createMockTFolder('new_folder'));
  }
  read(): Promise<string> {
    return Promise.resolve('');
  }
  cachedRead(): Promise<string> {
    return Promise.resolve('');
  }
  readBinary(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }
  getResourcePath(): string {
    return '';
  }
  delete(): Promise<void> {
    return Promise.resolve();
  }
  trash(): Promise<void> {
    return Promise.resolve();
  }
  rename(): Promise<void> {
    return Promise.resolve();
  }
  modify(): Promise<void> {
    return Promise.resolve();
  }
  modifyBinary(): Promise<void> {
    return Promise.resolve();
  }
  append(): Promise<void> {
    return Promise.resolve();
  }
  process(): Promise<string> {
    return Promise.resolve('');
  }
  copy<T extends TAbstractFile>(file: T, newPath: string): Promise<T> {
    // Simple mock: return a new instance of the same type, or cast
    if (file instanceof TFile) {
      return Promise.resolve(createMockTFile(newPath.split('/').pop() ?? '', newPath) as unknown as T);
    } else if (file instanceof TFolder) {
      return Promise.resolve(createMockTFolder(newPath) as unknown as T);
    } else {
      // Fallback or throw error if needed
      return Promise.reject(new Error('Cannot copy unknown file type'));
    }
  }
  getAllLoadedFiles(): TFile[] {
    return [];
  }
  getAllFolders(): TFolder[] {
    return [];
  }
  /**
   * Returns an array of mock markdown files by default.
   * Override in tests if needed.
   */
  getMarkdownFiles(): TFile[] {
    const folders = createMockMarkdownFiles(1, 1);
    return folders.flatMap((folder) => folder.children as TFile[]);
  }
  getFiles(): TFile[] {
    return [];
  }
  static recurseChildren(folder: TFolder, callback: (file: TFile | TFolder) => void): void {
    callback(folder);
  }
}
