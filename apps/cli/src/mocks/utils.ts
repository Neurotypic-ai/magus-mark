/**
 * Mock implementations of utility functions
 */
import * as path from 'path';
import { promisify } from 'util';

import * as fs from 'fs-extra';

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    return await fs.pathExists(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Find files matching a pattern
 */
export async function findFiles(dir: string, pattern: string): Promise<string[]> {
  try {
    // Mock implementation that returns files in the directory
    const files = await fs.readdir(dir);
    return files
      .filter((file) => {
        // Simple glob-like pattern matching
        if (pattern === '*') return true;
        if (pattern.startsWith('*.')) {
          const ext = pattern.substring(1);
          return file.endsWith(ext);
        }
        return file.includes(pattern);
      })
      .map((file) => path.join(dir, file));
  } catch (error) {
    return [];
  }
}

/**
 * Read file
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Could not read file ${filePath}: ${String(error)}`);
  }
}

/**
 * Write file
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Could not write file ${filePath}: ${String(error)}`);
  }
}

/**
 * Delete file
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.remove(filePath);
  } catch (error) {
    throw new Error(`Could not delete file ${filePath}: ${String(error)}`);
  }
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    throw new Error(`Could not create directory ${dirPath}: ${String(error)}`);
  }
}

/**
 * Format a file path for display
 */
export function formatPath(filePath: string): string {
  const homedir = process.env['HOME'] ?? process.env['USERPROFILE'] ?? '~';
  return filePath.replace(homedir, '~');
}

/**
 * Calculate tokens in a string
 */
export function calculateTokens(text: string): number {
  // Approximation: 1 token = 4 characters on average
  return Math.ceil(text.length / 4);
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(amount);
}

/**
 * Format a duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

/**
 * Get file size in a human-readable format
 */
export function getFileSize(filePath: string): string {
  try {
    const stats = fs.statSync(filePath);
    const bytes = stats.size;

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size > 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Execute a shell command
 */
export async function executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  const exec = promisify(require('child_process').exec);
  try {
    return await exec(command);
  } catch (error: any) {
    throw new Error(`Command failed: ${command}\n${error.stderr ?? error.message}`);
  }
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const typedKey = key as keyof T;

      const sourceValue = source[typedKey];

      if (isObject(sourceValue)) {
        if (!(key in target)) {
          Object.assign(output, { [typedKey]: sourceValue });
        } else {
          const targetValue = target[typedKey];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          output[typedKey] = deepMerge(targetValue as Record<string, any>, sourceValue as Record<string, any>) as any;
        }
      } else {
        Object.assign(output, { [typedKey]: sourceValue });
      }
    });
  }

  return output;
}

/**
 * Check if value is an object
 */
function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}
