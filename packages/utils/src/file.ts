/**
 * File utility functions for Obsidian Magic
 */
import path from 'node:path';

import fs from 'fs-extra';
import { z } from 'zod';

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath - Path to the directory
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * Reads a file from the filesystem
 * @param filePath - Path to the file
 * @returns File contents as string
 */
export async function readFile(filePath: string): Promise<string> {
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
export async function readJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T> {
  try {
    const fileContent = await readFile(filePath);
    const parsedData = JSON.parse(fileContent);
    return schema.parse(parsedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid JSON schema in ${filePath}: ${error.message}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Writes a string to a file
 * @param filePath - Path to the file
 * @param content - Content to write
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await ensureDirectory(path.dirname(filePath));
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
export async function writeJsonFile<T>(filePath: string, data: T, pretty = true): Promise<void> {
  const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);

  await writeFile(filePath, content);
}

/**
 * Checks if a file exists
 * @param filePath - Path to the file
 * @returns True if the file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
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
export async function findFiles(dirPath: string, pattern: RegExp): Promise<string[]> {
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
export async function getFileStats(filePath: string): Promise<fs.Stats | null> {
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
export async function safeDeleteFile(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}
