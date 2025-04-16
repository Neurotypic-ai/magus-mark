/**
 * File utility functions for Obsidian Magic
 */
import path from 'node:path';

import * as fs from 'fs-extra';
import { z } from 'zod';

import { FileSystemError } from '../errors/FileSystemError';
import { Result } from '../errors/Result';
import { toAppError } from '../errors/utils';

/**
 * Class providing file system utility methods for Obsidian Magic
 *
 * Initialize with a base path to perform all operations relative to that directory.
 *
 * @example
 * // For Obsidian vault operations
 * const vaultUtils = new FileUtils(vaultPath);
 * await vaultUtils.readFile('path/relative/to/vault.md');
 *
 * // For project directory operations
 * const projectUtils = new FileUtils(projectPath);
 * await projectUtils.writeJsonFile('config.json', config);
 */
export class FileUtils {
  /**
   * Creates a new FileUtils instance
   * @param basePath - Base directory for relative paths. All file operations will be relative to this path.
   */
  constructor(private readonly basePath: string) {}

  /**
   * Resolves a path relative to the base path
   * @param filePath - Path to resolve
   * @returns Resolved path
   */
  private resolvePath(filePath: string): string {
    return path.join(this.basePath, filePath);
  }

  /**
   * Ensures a directory exists, creating it if necessary
   * @param dirPath - Path to the directory, relative to basePath
   */
  async ensureDirectory(dirPath: string): Promise<Result<void>> {
    try {
      await fs.ensureDir(this.resolvePath(dirPath));
      return Result.ok(undefined);
    } catch (err: unknown) {
      return Result.fail(
        new FileSystemError(`Failed to create directory at ${dirPath}`, {
          cause: toAppError(err),
          path: this.resolvePath(dirPath),
        })
      );
    }
  }

  /**
   * Reads a file from the filesystem
   * @param filePath - Path to the file, relative to basePath
   * @returns File contents as string
   */
  async readFile(filePath: string): Promise<Result<string>> {
    try {
      const content = await fs.readFile(this.resolvePath(filePath), 'utf-8');
      return Result.ok(content);
    } catch (err: unknown) {
      return Result.fail(
        new FileSystemError(`Failed to read file at ${filePath}`, {
          cause: toAppError(err),
          path: this.resolvePath(filePath),
        })
      );
    }
  }

  /**
   * Reads a JSON file and validates it against a schema
   * @param filePath - Path to the JSON file, relative to basePath
   * @param schema - Zod schema for validation
   * @returns Parsed and validated JSON
   */
  async readJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<Result<T>> {
    const fileResult = await this.readFile(filePath);

    if (fileResult.isFail()) {
      return Result.fail(fileResult.getError());
    }

    try {
      const parsedData = JSON.parse(fileResult.getValue()) as T;
      return Result.ok(schema.parse(parsedData));
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        return Result.fail(
          new FileSystemError(`Invalid JSON schema in ${filePath}`, {
            cause: toAppError(err),
            path: this.resolvePath(filePath),
          })
        );
      }
      if (err instanceof SyntaxError) {
        return Result.fail(
          new FileSystemError(`Invalid JSON in ${filePath}`, {
            cause: toAppError(err),
            path: this.resolvePath(filePath),
          })
        );
      }
      return Result.fail(
        new FileSystemError(`Error processing JSON file ${filePath}`, {
          cause: toAppError(err),
          path: this.resolvePath(filePath),
        })
      );
    }
  }

  /**
   * Writes a string to a file
   * @param filePath - Path to the file, relative to basePath
   * @param content - Content to write
   */
  async writeFile(filePath: string, content: string): Promise<Result<void>> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      const dirResult = await this.ensureDirectory(path.dirname(filePath));

      if (dirResult.isFail()) {
        return dirResult;
      }

      await fs.writeFile(resolvedPath, content, 'utf-8');
      return Result.ok(undefined);
    } catch (err: unknown) {
      return Result.fail(
        new FileSystemError(`Failed to write file at ${filePath}`, {
          cause: toAppError(err),
          path: this.resolvePath(filePath),
        })
      );
    }
  }

  /**
   * Writes a JSON object to a file
   * @param filePath - Path to the file, relative to basePath
   * @param data - Data to write
   * @param pretty - Whether to format the JSON (default: true)
   */
  async writeJsonFile(filePath: string, data: unknown, pretty = true): Promise<Result<void>> {
    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    return this.writeFile(filePath, content);
  }

  /**
   * Checks if a file exists
   * @param filePath - Path to the file, relative to basePath
   * @returns True if the file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolvePath(filePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Recursively finds all files matching a pattern
   * @param dirPath - Directory to search in, relative to basePath
   * @param pattern - Regex pattern to match against
   * @returns Array of matching file paths (fully resolved)
   */
  async findFiles(dirPath: string, pattern: RegExp): Promise<Result<string[]>> {
    const results: string[] = [];
    const resolvedDirPath = this.resolvePath(dirPath);

    try {
      async function scan(currentPath: string): Promise<void> {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);

          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.isFile() && pattern.test(entry.name)) {
            results.push(fullPath);
          }
        }
      }

      await scan(resolvedDirPath);
      return Result.ok(results);
    } catch (err: unknown) {
      return Result.fail(
        new FileSystemError(`Failed to find files in ${dirPath}`, {
          cause: toAppError(err),
          path: resolvedDirPath,
        })
      );
    }
  }

  /**
   * Gets file stats with error handling
   * @param filePath - Path to the file, relative to basePath
   * @returns File stats or null if file doesn't exist
   */
  async getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
      return await fs.stat(this.resolvePath(filePath));
    } catch {
      return null;
    }
  }

  /**
   * Get file size in a human-readable format
   * @param filePath - Path to the file, relative to basePath
   * @returns Human-readable file size
   */
  getFileSize(filePath: string): Result<string> {
    try {
      const stats = fs.statSync(this.resolvePath(filePath));
      const bytes = stats.size;

      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;

      while (size > 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }

      return Result.ok(`${size.toFixed(1)} ${String(units[unitIndex])}`);
    } catch (err: unknown) {
      return Result.fail(
        new FileSystemError(`Failed to get file size for ${filePath}`, {
          cause: toAppError(err),
          path: this.resolvePath(filePath),
        })
      );
    }
  }

  /**
   * Safely deletes a file if it exists
   * @param filePath - Path to the file, relative to basePath
   * @returns True if file was deleted, false if it didn't exist
   */
  async safeDeleteFile(filePath: string): Promise<Result<boolean>> {
    try {
      await fs.unlink(this.resolvePath(filePath));
      return Result.ok(true);
    } catch (err: unknown) {
      const nodeError = err as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOENT') {
        return Result.ok(false);
      }
      return Result.fail(
        new FileSystemError(`Failed to delete file at ${filePath}`, {
          cause: toAppError(err),
          path: this.resolvePath(filePath),
        })
      );
    }
  }
}
