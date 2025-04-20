import { TFile, TFolder } from 'obsidian';

/**
 * Helper to create an array of mock markdown files.
 * @param folderCount Number of folders to create
 * @param fileCount Number of files to create in each folder
 * @param filenamePrefix Prefix for the filename
 * @returns TFile[]
 */

export function createMockMarkdownFiles(folderCount: number, fileCount: number, filenamePrefix = 'note'): TFolder[] {
  return Array.from({ length: folderCount }, (_, i) => {
    const folder = createMockTFolder(`folder${String(i + 1)}`, fileCount, filenamePrefix);
    return folder;
  });
}
/**
 * Helper to create an array of mock markdown files.
 * @param fileCount Number of files to create
 * @param filenamePrefix Prefix for the filename
 * @returns TFile[]
 */

export function createMockTFiles(fileCount: number, filenamePrefix = 'note'): TFile[] {
  return Array.from({ length: fileCount }, (_, i) => {
    const filename = `${filenamePrefix}${String(i + 1)}.md`;
    return createMockTFile(filename, '');
  });
}
/**
 * Helper to create a mock TFile.
 * @param filename Filename
 * @param path Path
 * @returns TFile
 */

export function createMockTFile(filename: string, path: string): TFile {
  const file = new TFile();
  file.path = [path, filename].join('/');
  file.basename = filename.replace(/\.md$/, '');
  file.extension = 'md';
  return file;
}
/**
 * Helper to create a mock TFolder.
 * @param path Path
 * @param filecount Number of files to create
 * @param filenamePrefix Prefix for the filename
 * @returns TFolder
 */

export function createMockTFolder(path: string, filecount = 2, filenamePrefix = 'note'): TFolder {
  const folder = new TFolder();
  folder.path = path;
  folder.name = path.split('/').pop() ?? '';
  folder.children = createMockTFiles(filecount, filenamePrefix);
  return folder;
}
