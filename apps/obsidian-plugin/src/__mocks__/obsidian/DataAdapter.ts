import { Events } from './MockEvents';

import type { ListedFiles as ListedFilesType, Stat as StatType } from 'obsidian';

/**
 * Minimal DataAdapter mock for Vault compatibility
 */

export class DataAdapter extends Events {
  getName(): string {
    return 'MockAdapter';
  }
  exists(): Promise<boolean> {
    return Promise.resolve(true);
  }
  stat(): Promise<StatType | null> {
    return Promise.resolve({ ctime: Date.now(), mtime: Date.now(), size: 0, type: 'file' });
  }
  list(): Promise<ListedFilesType> {
    return Promise.resolve({ files: ['mockFile1.md', 'mockFile2.md'], folders: ['mockFolder1', 'mockFolder2'] });
  }
  read(): Promise<string> {
    return Promise.resolve('');
  }
  readBinary(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }
  write(): Promise<void> {
    return Promise.resolve();
  }
  writeBinary(): Promise<void> {
    return Promise.resolve();
  }
  remove(): Promise<void> {
    return Promise.resolve();
  }
  rename(): Promise<void> {
    return Promise.resolve();
  }
  copy(): Promise<void> {
    return Promise.resolve();
  }
  mkdir(): Promise<void> {
    return Promise.resolve();
  }
  trashSystem(): Promise<boolean> {
    return Promise.resolve(true);
  }
  getResourcePath(): string {
    return '';
  }
  basePath = '';
  append(): Promise<void> {
    return Promise.resolve();
  }
  process(): Promise<string> {
    return Promise.resolve('');
  }
  trashLocal(): Promise<void> {
    return Promise.resolve();
  }
  rmdir(): Promise<void> {
    return Promise.resolve();
  }
}
