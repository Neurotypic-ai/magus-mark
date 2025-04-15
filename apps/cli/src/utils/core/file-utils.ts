/**
 * File utilities for the CLI
 * Provides re-exports of file-related functions from the core package
 */
import { FileUtils } from '@obsidian-magic/core/utils/FileUtils';

// Re-export the FileUtils class
export { FileUtils };

// Create convenience functions that match the old imports
export async function fileExists(filePath: string): Promise<boolean> {
  const fileUtils = new FileUtils(process.cwd());
  return fileUtils.fileExists(filePath);
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const fileUtils = new FileUtils(process.cwd());
  const result = await fileUtils.writeFile(filePath, content);
  if (result.isFail()) {
    throw result.getError();
  }
}
