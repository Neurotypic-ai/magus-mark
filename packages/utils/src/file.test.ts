import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { z } from 'zod';
import type * as fsTypes from 'fs-extra';

// Import the module under test, but mock the fs-extra dependency
const mockEnsureDir = vi.fn();
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockAccess = vi.fn();
const mockReaddir = vi.fn();
const mockStat = vi.fn();
const mockUnlink = vi.fn();

vi.mock('fs-extra', () => ({
  ensureDir: mockEnsureDir,
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  access: mockAccess,
  readdir: mockReaddir,
  stat: mockStat,
  unlink: mockUnlink
}));

// Import after mocking
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
      mockEnsureDir.mockResolvedValue(undefined);
      
      await ensureDirectory(testDir);
      expect(mockEnsureDir).toHaveBeenCalledWith(testDir);
    });
  });

  describe('readFile', () => {
    it('should read file contents', async () => {
      const testPath = '/path/to/file.txt';
      const testContent = 'file content';
      mockReadFile.mockResolvedValue(testContent);

      const result = await readFile(testPath);
      expect(result).toBe(testContent);
      expect(mockReadFile).toHaveBeenCalledWith(testPath, 'utf-8');
    });

    it('should throw error when read fails', async () => {
      const testPath = '/path/to/nonexistent.txt';
      mockReadFile.mockRejectedValue(new Error('File not found'));

      await expect(readFile(testPath)).rejects.toThrow('Failed to read file');
      expect(mockReadFile).toHaveBeenCalledWith(testPath, 'utf-8');
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
      
      mockReadFile.mockResolvedValue(testContent);

      const result = await readJsonFile(testPath, testSchema);
      expect(result).toEqual({ name: 'test', value: 123 });
      expect(mockReadFile).toHaveBeenCalledWith(testPath, 'utf-8');
    });

    it('should throw error on invalid JSON', async () => {
      const testPath = '/path/to/invalid.json';
      const testContent = '{invalid json}';
      const testSchema = z.object({});
      
      mockReadFile.mockResolvedValue(testContent);

      await expect(readJsonFile(testPath, testSchema)).rejects.toThrow('Invalid JSON');
    });

    it('should throw error on schema validation failure', async () => {
      const testPath = '/path/to/valid.json';
      const testContent = '{"name": 123}'; // name should be string
      const testSchema = z.object({
        name: z.string()
      });
      
      mockReadFile.mockResolvedValue(testContent);

      await expect(readJsonFile(testPath, testSchema)).rejects.toThrow('Invalid JSON schema');
    });
  });

  describe('writeFile', () => {
    it('should write content to file', async () => {
      const testPath = '/path/to/file.txt';
      const testContent = 'file content';
      
      mockEnsureDir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      
      await writeFile(testPath, testContent);
      expect(mockEnsureDir).toHaveBeenCalledWith(path.dirname(testPath));
      expect(mockWriteFile).toHaveBeenCalledWith(testPath, testContent, 'utf-8');
    });

    it('should throw error when write fails', async () => {
      const testPath = '/path/to/file.txt';
      const testContent = 'file content';
      
      mockEnsureDir.mockResolvedValue(undefined);
      mockWriteFile.mockRejectedValue(new Error('Permission denied'));

      await expect(writeFile(testPath, testContent)).rejects.toThrow('Failed to write file');
    });
  });

  describe('writeJsonFile', () => {
    it('should write JSON with pretty formatting by default', async () => {
      const testPath = '/path/to/file.json';
      const testData = { name: 'test', value: 123 };
      
      mockEnsureDir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      
      await writeJsonFile(testPath, testData);
      expect(mockEnsureDir).toHaveBeenCalledWith(path.dirname(testPath));
      expect(mockWriteFile).toHaveBeenCalledWith(
        testPath, 
        JSON.stringify(testData, null, 2), 
        'utf-8'
      );
    });

    it('should write compact JSON when pretty=false', async () => {
      const testPath = '/path/to/file.json';
      const testData = { name: 'test', value: 123 };
      
      mockEnsureDir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      
      await writeJsonFile(testPath, testData, false);
      expect(mockWriteFile).toHaveBeenCalledWith(
        testPath, 
        JSON.stringify(testData), 
        'utf-8'
      );
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      const testPath = '/path/to/existing.txt';
      mockAccess.mockResolvedValue(undefined);

      const result = await fileExists(testPath);
      expect(result).toBe(true);
      expect(mockAccess).toHaveBeenCalledWith(testPath);
    });

    it('should return false when file does not exist', async () => {
      const testPath = '/path/to/nonexistent.txt';
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const result = await fileExists(testPath);
      expect(result).toBe(false);
      expect(mockAccess).toHaveBeenCalledWith(testPath);
    });
  });

  describe('findFiles', () => {
    it('should find files matching pattern', async () => {
      const testDir = '/path/to/dir';
      const testPattern = /\.md$/;
      
      // Setup mocks for readdir to return different values based on path
      mockReaddir.mockImplementation((dirPath) => {
        if (dirPath === '/path/to/dir') {
          return Promise.resolve([
            { name: 'file1.md', isDirectory: () => false, isFile: () => true },
            { name: 'file2.txt', isDirectory: () => false, isFile: () => true },
            { name: 'subdir', isDirectory: () => true, isFile: () => false }
          ] as unknown as fsTypes.Dirent[]);
        } 
        
        if (dirPath === '/path/to/dir/subdir') {
          return Promise.resolve([
            { name: 'file3.md', isDirectory: () => false, isFile: () => true }
          ] as unknown as fsTypes.Dirent[]);
        }
        
        return Promise.resolve([] as unknown as fsTypes.Dirent[]);
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
      const mockStats = { size: 100, mtime: new Date() } as fsTypes.Stats;
      mockStat.mockResolvedValue(mockStats);

      const result = await getFileStats(testPath);
      expect(result).toBe(mockStats);
      expect(mockStat).toHaveBeenCalledWith(testPath);
    });

    it('should return null when file does not exist', async () => {
      const testPath = '/path/to/nonexistent.txt';
      mockStat.mockRejectedValue(new Error('ENOENT'));

      const result = await getFileStats(testPath);
      expect(result).toBeNull();
      expect(mockStat).toHaveBeenCalledWith(testPath);
    });
  });

  describe('safeDeleteFile', () => {
    it('should delete file and return true when file exists', async () => {
      const testPath = '/path/to/file.txt';
      mockUnlink.mockResolvedValue(undefined);

      const result = await safeDeleteFile(testPath);
      expect(result).toBe(true);
      expect(mockUnlink).toHaveBeenCalledWith(testPath);
    });

    it('should return false when file does not exist', async () => {
      const testPath = '/path/to/nonexistent.txt';
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockUnlink.mockRejectedValue(error);

      const result = await safeDeleteFile(testPath);
      expect(result).toBe(false);
      expect(mockUnlink).toHaveBeenCalledWith(testPath);
    });

    it('should throw error for other errors', async () => {
      const testPath = '/path/to/file.txt';
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EPERM';
      mockUnlink.mockRejectedValue(error);

      await expect(safeDeleteFile(testPath)).rejects.toThrow('Permission denied');
      expect(mockUnlink).toHaveBeenCalledWith(testPath);
    });
  });
}); 