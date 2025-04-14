/**
 * File utility functions for Obsidian Magic
 */
import path from 'node:path';

import fs from 'fs-extra';
import { z } from 'zod';

/**
 * Class providing file system utility methods for Obsidian Magic
 */
export class FileUtils {
  private basePath: string;

  /**
   * Creates a new FileUtils instance
   * @param basePath - Optional base directory for relative paths
   */
  constructor(basePath = '') {
    this.basePath = basePath;
  }

  /**
   * Resolves a path relative to the base path
   * @param filePath - Path to resolve
   * @returns Resolved path
   */
  private resolvePath(filePath: string): string {
    return this.basePath ? path.join(this.basePath, filePath) : filePath;
  }

  /**
   * Ensures a directory exists, creating it if necessary
   * @param dirPath - Path to the directory
   */
  async ensureDirectory(dirPath: string): Promise<void> {
    await fs.ensureDir(this.resolvePath(dirPath));
  }

  /**
   * Reads a file from the filesystem
   * @param filePath - Path to the file
   * @returns File contents as string
   */
  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(this.resolvePath(filePath), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file at ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Reads a JSON file and validates it against a schema
   * @param filePath - Path to the JSON file
   * @param schema - Zod schema for validation
   * @returns Parsed and validated JSON
   */
  async readJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T> {
    try {
      const fileContent = await this.readFile(filePath);
      const parsedData = JSON.parse(fileContent) as T;
      return schema.parse(parsedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid JSON schema in ${filePath}: ${error.message}`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Writes a string to a file
   * @param filePath - Path to the file
   * @param content - Content to write
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      await this.ensureDirectory(path.dirname(resolvedPath));
      await fs.writeFile(resolvedPath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file at ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Writes a JSON object to a file
   * @param filePath - Path to the file
   * @param data - Data to write
   * @param pretty - Whether to format the JSON (default: true)
   */
  async writeJsonFile(filePath: string, data: unknown, pretty = true): Promise<void> {
    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    await this.writeFile(filePath, content);
  }

  /**
   * Checks if a file exists
   * @param filePath - Path to the file
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
   * @param dirPath - Directory to search in
   * @param pattern - Regex pattern to match against
   * @returns Array of matching file paths
   */
  async findFiles(dirPath: string, pattern: RegExp): Promise<string[]> {
    const results: string[] = [];
    const resolvedDirPath = this.resolvePath(dirPath);

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
    return results;
  }

  /**
   * Gets file stats with error handling
   * @param filePath - Path to the file
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
   * Safely deletes a file if it exists
   * @param filePath - Path to the file
   * @returns True if file was deleted, false if it didn't exist
   */
  async safeDeleteFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(this.resolvePath(filePath));
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  // Static methods for convenience

  /**
   * Ensures a directory exists, creating it if necessary
   * @param dirPath - Path to the directory
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  /**
   * Reads a file from the filesystem
   * @param filePath - Path to the file
   * @returns File contents as string
   */
  static async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file at ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Reads a JSON file and validates it against a schema
   * @param filePath - Path to the JSON file
   * @param schema - Zod schema for validation
   * @returns Parsed and validated JSON
   */
  static async readJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T> {
    try {
      const fileContent = await FileUtils.readFile(filePath);
      const parsedData = JSON.parse(fileContent) as T;
      return schema.parse(parsedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid JSON schema in ${filePath}: ${error.message}`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Writes a string to a file
   * @param filePath - Path to the file
   * @param content - Content to write
   */
  static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await FileUtils.ensureDirectory(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file at ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Writes a JSON object to a file
   * @param filePath - Path to the file
   * @param data - Data to write
   * @param pretty - Whether to format the JSON (default: true)
   */
  static async writeJsonFile(filePath: string, data: unknown, pretty = true): Promise<void> {
    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    await FileUtils.writeFile(filePath, content);
  }

  /**
   * Checks if a file exists
   * @param filePath - Path to the file
   * @returns True if the file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Recursively finds all files matching a pattern
   * @param dirPath - Directory to search in
   * @param pattern - Regex pattern to match against
   * @returns Array of matching file paths
   */
  static async findFiles(dirPath: string, pattern: RegExp): Promise<string[]> {
    const results: string[] = [];

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

    await scan(dirPath);
    return results;
  }

  /**
   * Gets file stats with error handling
   * @param filePath - Path to the file
   * @returns File stats or null if file doesn't exist
   */
  static async getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
      return await fs.stat(filePath);
    } catch {
      return null;
    }
  }

  /**
   * Safely deletes a file if it exists
   * @param filePath - Path to the file
   * @returns True if file was deleted, false if it didn't exist
   */
  static async safeDeleteFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
}
