import { vi } from 'vitest';

import { TFile, TFolder } from '../obsidian';
import { DataAdapter } from './DataAdapter';
import { createMockMarkdownFiles, createMockTFile, createMockTFolder } from './FileMockHelpers';
import { Events } from './MockEvents';

import type { Vault as VaultType } from 'obsidian';
import type { Mock } from 'vitest';

/**
 * Minimal Vault stub with getMarkdownFiles returning mock files by default.
 * @example
 *   const vault = new Vault();
 *   const files = vault.getMarkdownFiles();
 */

export class Vault extends Events implements VaultType {
  configDir = '.obsidian';
  adapter: DataAdapter = new DataAdapter();

  getName: Mock<() => string> = vi.fn(() => 'MockVault');
  getFileByPath: Mock<() => TFile | null> = vi.fn(() => null);
  getFolderByPath: Mock<() => TFolder | null> = vi.fn(() => null);
  getAbstractFileByPath: Mock<(path: string) => TFile | TFolder | null> = vi.fn((path: string) => {
    if (path.endsWith('.md')) {
      return createMockTFile(path.split('/').pop() ?? '', path);
    }
    if (!path.includes('.') || /\.\w+$/.exec(path) === null || !['md'].includes(path.split('.').pop() ?? '')) {
      return createMockTFolder(path.split('/').pop() ?? '', 0, 'folder');
    }
    return null;
  });
  getRoot: Mock<() => TFolder> = vi.fn(() => createMockTFolder('/'));
  create: Mock<() => Promise<TFile>> = vi.fn(() => Promise.resolve(createMockTFile('new_file.md', '')));
  createBinary: Mock<() => Promise<TFile>> = vi.fn(() => Promise.resolve(createMockTFile('new_file.md', '')));
  createFolder: Mock<() => Promise<TFolder>> = vi.fn(() => Promise.resolve(createMockTFolder('new_folder')));
  read: Mock<() => Promise<string>> = vi.fn(() => Promise.resolve(''));
  cachedRead: Mock<() => Promise<string>> = vi.fn(() => Promise.resolve(''));
  readBinary: Mock<() => Promise<ArrayBuffer>> = vi.fn(() => Promise.resolve(new ArrayBuffer(0)));
  getResourcePath: Mock<() => string> = vi.fn(() => '');
  delete: Mock<() => Promise<void>> = vi.fn(() => Promise.resolve());
  trash: Mock<() => Promise<void>> = vi.fn(() => Promise.resolve());
  rename: Mock<() => Promise<void>> = vi.fn(() => Promise.resolve());
  modify: Mock<() => Promise<void>> = vi.fn(() => Promise.resolve());
  modifyBinary: Mock<() => Promise<void>> = vi.fn(() => Promise.resolve());
  append: Mock<() => Promise<void>> = vi.fn(() => Promise.resolve());
  process: Mock<() => Promise<string>> = vi.fn(() => Promise.resolve(''));
  copy: Mock<(file: any, newPath: string) => Promise<any>> = vi.fn((file, newPath) => {
    // Simple mock: return a new instance of the same type, or cast
    if (file instanceof TFile) {
      return Promise.resolve(createMockTFile(newPath.split('/').pop() ?? '', newPath));
    } else if (file instanceof TFolder) {
      return Promise.resolve(createMockTFolder(newPath));
    } else {
      // Fallback or throw error if needed
      return Promise.reject(new Error('Cannot copy unknown file type'));
    }
  });
  getAllLoadedFiles: Mock<() => TFile[]> = vi.fn(() => []);
  getAllFolders: Mock<() => TFolder[]> = vi.fn(() => []);
  /**
   * Returns an array of mock markdown files by default.
   * Override in tests if needed.
   */
  getMarkdownFiles: Mock<() => TFile[]> = vi.fn(() => {
    const folders = createMockMarkdownFiles(1, 1);
    return folders.flatMap((folder) => folder.children as TFile[]);
  });
  getFiles: Mock<() => TFile[]> = vi.fn(() => []);

  static recurseChildren(folder: TFolder, callback: (file: TFile | TFolder) => void): void {
    callback(folder);
  }
}
