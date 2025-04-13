import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import path from 'node:path';
import { z } from 'zod';
import {
  ensureDirectory,
  readFile,
  readJsonFile,
  writeFile,
  writeJsonFile,
  fileExists,
  findFiles,
  getFileStats,
  safeDeleteFile
} from './file';

// Mock fs-extra
vi.mock('fs-extra', () => ({
  ensureDir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn()
}));

describe('File Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const testDir = '/path/to/dir';
      await ensureDirectory(testDir);
      expect(fs.ensureDir).toHaveBeenCalledWith(testDir);
    });
  });

  describe('readFile', () => {
    it('should read file contents', async () => {
      const testPath = '/path/to/file.txt';
      const testContent = 'file content';
      vi.mocked(fs.readFile).mockResolvedValue(testContent as any);

      const result = await readFile(testPath);
      expect(result).toBe(testContent);
      expect(fs.readFile).toHaveBeenCalledWith(testPath, 'utf-8');
    });

    it('should throw error when read fails', async () => {
      const testPath = '/path/to/nonexistent.txt';
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      await expect(readFile(testPath)).rejects.toThrow('Failed to read file');
      expect(fs.readFile).toHaveBeenCalledWith(testPath, 'utf-8');
    });
  });

  describe('readJsonFile', () => {
    it('should read and validate JSON file', async () => {
      const testPath = '/path/to/file.json';
      const testContent = '{"name": "test", "value": 123}';
      const testSchema = z.object({
        name: z.string(),
        value: z.number()
      });
      
      vi.mocked(fs.readFile).mockResolvedValue(testContent as any);

      const result = await readJsonFile(testPath, testSchema);
      expect(result).toEqual({ name: 'test', value: 123 });
      expect(fs.readFile).toHaveBeenCalledWith(testPath, 'utf-8');
    });

    it('should throw error on invalid JSON', async () => {
      const testPath = '/path/to/invalid.json';
      const testContent = '{invalid json}';
      const testSchema = z.object({});
      
      vi.mocked(fs.readFile).mockResolvedValue(testContent as any);

      await expect(readJsonFile(testPath, testSchema)).rejects.toThrow('Invalid JSON');
    });

    it('should throw error on schema validation failure', async () => {
      const testPath = '/path/to/valid.json';
      const testContent = '{"name": 123}'; // name should be string
      const testSchema = z.object({
        name: z.string()
      });
      
      vi.mocked(fs.readFile).mockResolvedValue(testContent as any);

      await expect(readJsonFile(testPath, testSchema)).rejects.toThrow('Invalid JSON schema');
    });
  });

  describe('writeFile', () => {
    it('should write content to file', async () => {
      const testPath = '/path/to/file.txt';
      const testContent = 'file content';
      
      await writeFile(testPath, testContent);
      expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(testPath));
      expect(fs.writeFile).toHaveBeenCalledWith(testPath, testContent, 'utf-8');
    });

    it('should throw error when write fails', async () => {
      const testPath = '/path/to/file.txt';
      const testContent = 'file content';
      
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Permission denied'));

      await expect(writeFile(testPath, testContent)).rejects.toThrow('Failed to write file');
    });
  });

  describe('writeJsonFile', () => {
    it('should write JSON with pretty formatting by default', async () => {
      const testPath = '/path/to/file.json';
      const testData = { name: 'test', value: 123 };
      
      await writeJsonFile(testPath, testData);
      expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(testPath));
      expect(fs.writeFile).toHaveBeenCalledWith(
        testPath, 
        JSON.stringify(testData, null, 2), 
        'utf-8'
      );
    });

    it('should write compact JSON when pretty=false', async () => {
      const testPath = '/path/to/file.json';
      const testData = { name: 'test', value: 123 };
      
      await writeJsonFile(testPath, testData, false);
      expect(fs.writeFile).toHaveBeenCalledWith(
        testPath, 
        JSON.stringify(testData), 
        'utf-8'
      );
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      const testPath = '/path/to/existing.txt';
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await fileExists(testPath);
      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith(testPath);
    });

    it('should return false when file does not exist', async () => {
      const testPath = '/path/to/nonexistent.txt';
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      const result = await fileExists(testPath);
      expect(result).toBe(false);
      expect(fs.access).toHaveBeenCalledWith(testPath);
    });
  });

  describe('findFiles', () => {
    it('should find files matching pattern', async () => {
      const testDir = '/path/to/dir';
      const testPattern = /\.md$/;
      
      vi.mocked(fs.readdir).mockImplementation((dirPath) => {
        if (dirPath === '/path/to/dir') {
          return Promise.resolve([
            { name: 'file1.md', isDirectory: () => false, isFile: () => true },
            { name: 'file2.txt', isDirectory: () => false, isFile: () => true },
            { name: 'subdir', isDirectory: () => true, isFile: () => false }
          ] as unknown as fs.Dirent[]);
        } else if (dirPath === '/path/to/dir/subdir') {
          return Promise.resolve([
            { name: 'file3.md', isDirectory: () => false, isFile: () => true }
          ] as unknown as fs.Dirent[]);
        }
        return Promise.resolve([] as unknown as fs.Dirent[]);
      });

      const result = await findFiles(testDir, testPattern);
      expect(result).toEqual([
        '/path/to/dir/file1.md',
        '/path/to/dir/subdir/file3.md'
      ]);
    });
  });

  describe('getFileStats', () => {
    it('should return stats when file exists', async () => {
      const testPath = '/path/to/file.txt';
      const mockStats = { size: 100, mtime: new Date() } as fs.Stats;
      vi.mocked(fs.stat).mockResolvedValue(mockStats as any);

      const result = await getFileStats(testPath);
      expect(result).toBe(mockStats);
      expect(fs.stat).toHaveBeenCalledWith(testPath);
    });

    it('should return null when file does not exist', async () => {
      const testPath = '/path/to/nonexistent.txt';
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

      const result = await getFileStats(testPath);
      expect(result).toBeNull();
      expect(fs.stat).toHaveBeenCalledWith(testPath);
    });
  });

  describe('safeDeleteFile', () => {
    it('should delete file and return true when file exists', async () => {
      const testPath = '/path/to/file.txt';
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      const result = await safeDeleteFile(testPath);
      expect(result).toBe(true);
      expect(fs.unlink).toHaveBeenCalledWith(testPath);
    });

    it('should return false when file does not exist', async () => {
      const testPath = '/path/to/nonexistent.txt';
      const error = new Error('File not found');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      vi.mocked(fs.unlink).mockRejectedValue(error);

      const result = await safeDeleteFile(testPath);
      expect(result).toBe(false);
      expect(fs.unlink).toHaveBeenCalledWith(testPath);
    });

    it('should throw error for other errors', async () => {
      const testPath = '/path/to/file.txt';
      const error = new Error('Permission denied');
      (error as NodeJS.ErrnoException).code = 'EPERM';
      vi.mocked(fs.unlink).mockRejectedValue(error);

      await expect(safeDeleteFile(testPath)).rejects.toThrow('Permission denied');
      expect(fs.unlink).toHaveBeenCalledWith(testPath);
    });
  });
}); 