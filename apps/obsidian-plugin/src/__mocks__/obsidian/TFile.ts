import type { TAbstractFile as TAbstractFileType, TFile as TFileType, TFolder as TFolderType } from 'obsidian';

export abstract class TAbstractFile implements Partial<TAbstractFileType> {
  public vault: any;
  public path: string;
  public name: string;
  public parent: TFolder | null;

  constructor(path: string) {
    this.path = path;
    this.name = path.split('/').pop() || '';
    this.parent = null;
  }
}

export class TFile extends TAbstractFile implements Partial<TFileType> {
  public extension: string;
  public basename: string;
  public stat: {
    ctime: number;
    mtime: number;
    size: number;
  };

  constructor(path: string) {
    super(path);
    const parts = this.name.split('.');
    this.extension = parts.length > 1 ? parts.pop()! : '';
    this.basename = parts.join('.');
    this.stat = {
      ctime: Date.now(),
      mtime: Date.now(),
      size: 0,
    };
  }
}

export class TFolder extends TAbstractFile implements Partial<TFolderType> {
  public children: TAbstractFile[] = [];

  constructor(path: string) {
    super(path);
  }

  public isRoot(): boolean {
    return this.path === '';
  }
}
