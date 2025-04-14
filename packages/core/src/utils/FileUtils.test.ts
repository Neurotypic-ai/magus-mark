import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

// Import after mocking
import { FileUtils } from './FileUtils';

import type { Dirent, Stats } from 'fs-extra';

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
  unlink: mockUnlink,
}));

describe('File Utilities', () => {
  const fileUtils = new FileUtils();
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Static Methods', () => {
    describe('ensureDirectory', () => {
      it('should create directory if it does not exist', async () => {
        const testDir = '/path/to/dir';
        mockEnsureDir.mockResolvedValue(undefined);

        await fileUtils.ensureDirectory(testDir);
        expect(mockEnsureDir).toHaveBeenCalledWith(testDir);
      });
    });

    describe('readFile', () => {
      it('should read file contents', async () => {
        const testPath = '/path/to/file.txt';
        const testContent = 'file content';
        mockReadFile.mockResolvedValue(testContent);

        const result = await fileUtils.readFile(testPath);
        expect(result).toBe(testContent);
        expect(mockReadFile).toHaveBeenCalledWith(testPath, 'utf-8');
      });

      it('should throw error when read fails', async () => {
        const testPath = '/path/to/nonexistent.txt';
        mockReadFile.mockRejectedValue(new Error('File not found'));

        await expect(fileUtils.readFile(testPath)).rejects.toThrow('Failed to read file');
        expect(mockReadFile).toHaveBeenCalledWith(testPath, 'utf-8');
      });
    });

    describe('readJsonFile', () => {
      it('should read and validate JSON file', async () => {
        const testPath = '/path/to/file.json';
        const testContent = '{"name": "test", "value": 123}';
        const testSchema = z.object({
          name: z.string(),
          value: z.number(),
        });

        mockReadFile.mockResolvedValue(testContent);

        const result = await fileUtils.readJsonFile(testPath, testSchema);
        expect(result).toEqual({ name: 'test', value: 123 });
        expect(mockReadFile).toHaveBeenCalledWith(testPath, 'utf-8');
      });

      it('should throw error on invalid JSON', async () => {
        const testPath = '/path/to/invalid.json';
        const testContent = '{invalid json}';
        const testSchema = z.object({});

        mockReadFile.mockResolvedValue(testContent);

        await expect(fileUtils.readJsonFile(testPath, testSchema)).rejects.toThrow('Invalid JSON');
      });

      it('should throw error on schema validation failure', async () => {
        const testPath = '/path/to/valid.json';
        const testContent = '{"name": 123}'; // name should be string
        const testSchema = z.object({
          name: z.string(),
        });

        mockReadFile.mockResolvedValue(testContent);

        await expect(fileUtils.readJsonFile(testPath, testSchema)).rejects.toThrow('Invalid JSON schema');
      });
    });

    describe('writeFile', () => {
      it('should write content to file', async () => {
        const testPath = '/path/to/file.txt';
        const testContent = 'file content';

        mockEnsureDir.mockResolvedValue(undefined);
        mockWriteFile.mockResolvedValue(undefined);

        await fileUtils.writeFile(testPath, testContent);
        expect(mockEnsureDir).toHaveBeenCalledWith(path.dirname(testPath));
        expect(mockWriteFile).toHaveBeenCalledWith(testPath, testContent, 'utf-8');
      });

      it('should throw error when write fails', async () => {
        const testPath = '/path/to/file.txt';
        const testContent = 'file content';

        mockEnsureDir.mockResolvedValue(undefined);
        mockWriteFile.mockRejectedValue(new Error('Permission denied'));

        await expect(fileUtils.writeFile(testPath, testContent)).rejects.toThrow('Failed to write file');
      });
    });

    describe('writeJsonFile', () => {
      it('should write JSON with pretty formatting by default', async () => {
        const testPath = '/path/to/file.json';
        const testData = { name: 'test', value: 123 };

        mockEnsureDir.mockResolvedValue(undefined);
        mockWriteFile.mockResolvedValue(undefined);

        await fileUtils.writeJsonFile(testPath, testData);
        expect(mockEnsureDir).toHaveBeenCalledWith(path.dirname(testPath));
        expect(mockWriteFile).toHaveBeenCalledWith(testPath, JSON.stringify(testData, null, 2), 'utf-8');
      });

      it('should write compact JSON when pretty=false', async () => {
        const testPath = '/path/to/file.json';
        const testData = { name: 'test', value: 123 };

        mockEnsureDir.mockResolvedValue(undefined);
        mockWriteFile.mockResolvedValue(undefined);

        await fileUtils.writeJsonFile(testPath, testData, false);
        expect(mockWriteFile).toHaveBeenCalledWith(testPath, JSON.stringify(testData), 'utf-8');
      });
    });

    describe('fileExists', () => {
      it('should return true when file exists', async () => {
        const testPath = '/path/to/existing.txt';
        mockAccess.mockResolvedValue(undefined);

        const result = await fileUtils.fileExists(testPath);
        expect(result).toBe(true);
        expect(mockAccess).toHaveBeenCalledWith(testPath);
      });

      it('should return false when file does not exist', async () => {
        const testPath = '/path/to/nonexistent.txt';
        mockAccess.mockRejectedValue(new Error('ENOENT'));

        const result = await fileUtils.fileExists(testPath);
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
              { name: 'subdir', isDirectory: () => true, isFile: () => false },
            ] as unknown as Dirent[]);
          }

          if (dirPath === '/path/to/dir/subdir') {
            return Promise.resolve([
              { name: 'file3.md', isDirectory: () => false, isFile: () => true },
            ] as unknown as Dirent[]);
          }

          return Promise.resolve([] as unknown as Dirent[]);
        });

        const result = await fileUtils.findFiles(testDir, testPattern);
        expect(result).toEqual(['/path/to/dir/file1.md', '/path/to/dir/subdir/file3.md']);
      });
    });

    describe('getFileStats', () => {
      it('should return stats when file exists', async () => {
        const testPath = '/path/to/file.txt';
        const mockStats = { size: 100, mtime: new Date() } as Stats;
        mockStat.mockResolvedValue(mockStats);

        const result = await fileUtils.getFileStats(testPath);
        expect(result).toBe(mockStats);
        expect(mockStat).toHaveBeenCalledWith(testPath);
      });

      it('should return null when file does not exist', async () => {
        const testPath = '/path/to/nonexistent.txt';
        mockStat.mockRejectedValue(new Error('ENOENT'));

        const result = await fileUtils.getFileStats(testPath);
        expect(result).toBeNull();
        expect(mockStat).toHaveBeenCalledWith(testPath);
      });
    });

    describe('safeDeleteFile', () => {
      it('should delete file and return true when file exists', async () => {
        const testPath = '/path/to/file.txt';
        mockUnlink.mockResolvedValue(undefined);

        const result = await fileUtils.safeDeleteFile(testPath);
        expect(result).toBe(true);
        expect(mockUnlink).toHaveBeenCalledWith(testPath);
      });

      it('should return false when file does not exist', async () => {
        const testPath = '/path/to/nonexistent.txt';
        const error = new Error('File not found') as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        mockUnlink.mockRejectedValue(error);

        const result = await fileUtils.safeDeleteFile(testPath);
        expect(result).toBe(false);
        expect(mockUnlink).toHaveBeenCalledWith(testPath);
      });

      it('should throw error for other errors', async () => {
        const testPath = '/path/to/file.txt';
        const error = new Error('Permission denied') as NodeJS.ErrnoException;
        error.code = 'EPERM';
        mockUnlink.mockRejectedValue(error);

        await expect(fileUtils.safeDeleteFile(testPath)).rejects.toThrow('Permission denied');
        expect(mockUnlink).toHaveBeenCalledWith(testPath);
      });
    });
  });

  describe('FileUtils Class', () => {
    describe('constructor', () => {
      it('should initialize with empty base path by default', () => {
        const fileUtils = new FileUtils();
        expect(fileUtils).toBeInstanceOf(FileUtils);
      });

      it('should initialize with provided base path', () => {
        const fileUtils = new FileUtils('/base/path');
        expect(fileUtils).toBeInstanceOf(FileUtils);
      });
    });

    describe('instance methods', () => {
      let fileUtils: FileUtils;

      beforeEach(() => {
        fileUtils = new FileUtils('/base/path');
      });

      describe('ensureDirectory', () => {
        it('should create directory with resolved path', async () => {
          const testDir = 'subdir';
          mockEnsureDir.mockResolvedValue(undefined);

          await fileUtils.ensureDirectory(testDir);
          expect(mockEnsureDir).toHaveBeenCalledWith(path.join('/base/path', testDir));
        });
      });

      describe('readFile', () => {
        it('should read file with resolved path', async () => {
          const testPath = 'file.txt';
          const testContent = 'file content';
          mockReadFile.mockResolvedValue(testContent);

          const result = await fileUtils.readFile(testPath);
          expect(result).toBe(testContent);
          expect(mockReadFile).toHaveBeenCalledWith(path.join('/base/path', testPath), 'utf-8');
        });
      });

      describe('fileExists', () => {
        it('should check if file exists with resolved path', async () => {
          const testPath = 'file.txt';
          mockAccess.mockResolvedValue(undefined);

          const result = await fileUtils.fileExists(testPath);
          expect(result).toBe(true);
          expect(mockAccess).toHaveBeenCalledWith(path.join('/base/path', testPath));
        });
      });

      // Additional instance method tests could be added here
    });
  });
});
