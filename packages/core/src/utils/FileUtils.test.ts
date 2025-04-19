import path from 'node:path';

import * as fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { FileSystemError } from '../errors/FileSystemError';
import { FileUtils } from './FileUtils';

import type { Dirent, Stats } from 'fs-extra';

vi.mock('fs-extra', () => ({
  ensureDir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
  statSync: vi.fn(),
}));

// Cast fs mocks
const mockEnsureDir = fs.ensureDir as unknown as ReturnType<typeof vi.fn>;
const mockReadFile = fs.readFile as unknown as ReturnType<typeof vi.fn>;
const mockWriteFile = fs.writeFile as unknown as ReturnType<typeof vi.fn>;
const mockAccess = fs.access as unknown as ReturnType<typeof vi.fn>;
const mockReaddir = fs.readdir as unknown as ReturnType<typeof vi.fn>;
const mockStat = fs.stat as unknown as ReturnType<typeof vi.fn>;
const mockUnlink = fs.unlink as unknown as ReturnType<typeof vi.fn>;
const mockStatSync = fs.statSync as unknown as ReturnType<typeof vi.fn>;

describe('FileUtils', () => {
  const BASE_PATH = '/base/path';
  let fileUtils: FileUtils;

  beforeEach(() => {
    vi.clearAllMocks();
    fileUtils = new FileUtils(BASE_PATH);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided base path', () => {
      const utils = new FileUtils('/test/path');
      expect(utils).toBeInstanceOf(FileUtils);
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory with resolved path', async () => {
      const testDir = 'subdir';
      mockEnsureDir.mockResolvedValue(undefined);

      const result = await fileUtils.ensureDirectory(testDir);
      expect(result.isOk()).toBe(true);
      expect(mockEnsureDir).toHaveBeenCalledWith(path.join(BASE_PATH, testDir));
    });

    it('should return error when directory creation fails', async () => {
      const testDir = 'subdir';
      const error = new Error('Permission denied');
      mockEnsureDir.mockRejectedValue(error);

      const result = await fileUtils.ensureDirectory(testDir);
      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileSystemError);
      expect(result.getError().message).toContain('Failed to create directory');
    });
  });

  describe('readFile', () => {
    it('should read file with resolved path', async () => {
      const testPath = 'file.txt';
      const testContent = 'file content';
      mockReadFile.mockResolvedValue(testContent);

      const result = await fileUtils.readFile(testPath);
      expect(result.isOk()).toBe(true);
      expect(result.getValue()).toBe(testContent);
      expect(mockReadFile).toHaveBeenCalledWith(path.join(BASE_PATH, testPath), 'utf-8');
    });

    it('should return error when read fails', async () => {
      const testPath = 'nonexistent.txt';
      mockReadFile.mockRejectedValue(new Error('File not found'));

      const result = await fileUtils.readFile(testPath);
      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileSystemError);
      expect(result.getError().message).toContain('Failed to read file');
    });
  });

  describe('readJsonFile', () => {
    it('should read and validate JSON file', async () => {
      const testPath = 'file.json';
      const testContent = '{"name": "test", "value": 123}';
      const testSchema = z.object({
        name: z.string(),
        value: z.number(),
      });

      mockReadFile.mockResolvedValue(testContent);

      const result = await fileUtils.readJsonFile(testPath, testSchema);
      expect(result.isOk()).toBe(true);
      expect(result.getValue()).toEqual({ name: 'test', value: 123 });
      expect(mockReadFile).toHaveBeenCalledWith(path.join(BASE_PATH, testPath), 'utf-8');
    });

    it('should return error on invalid JSON', async () => {
      const testPath = 'invalid.json';
      const testContent = '{invalid json}';
      const testSchema = z.object({});

      mockReadFile.mockResolvedValue(testContent);

      const result = await fileUtils.readJsonFile(testPath, testSchema);
      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileSystemError);
      expect(result.getError().message).toContain('Invalid JSON');
    });

    it('should return error on schema validation failure', async () => {
      const testPath = 'valid.json';
      const testContent = '{"name": 123}'; // name should be string
      const testSchema = z.object({
        name: z.string(),
      });

      mockReadFile.mockResolvedValue(testContent);

      const result = await fileUtils.readJsonFile(testPath, testSchema);
      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileSystemError);
      expect(result.getError().message).toContain('Invalid JSON schema');
    });

    it('should propagate error from readFile', async () => {
      const testPath = 'error.json';
      const testSchema = z.object({});
      mockReadFile.mockRejectedValue(new Error('File not found'));

      const result = await fileUtils.readJsonFile(testPath, testSchema);
      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileSystemError);
      expect(result.getError().message).toContain('Failed to read file');
    });
  });

  describe('writeFile', () => {
    it('should write content to file with resolved path', async () => {
      const testPath = 'file.txt';
      const testContent = 'file content';

      mockEnsureDir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const result = await fileUtils.writeFile(testPath, testContent);
      expect(result.isOk()).toBe(true);
      expect(mockEnsureDir).toHaveBeenCalledWith(path.join(BASE_PATH, path.dirname(testPath)));
      expect(mockWriteFile).toHaveBeenCalledWith(path.join(BASE_PATH, testPath), testContent, 'utf-8');
    });

    it('should return error when write fails', async () => {
      const testPath = 'file.txt';
      const testContent = 'file content';

      mockEnsureDir.mockResolvedValue(undefined);
      mockWriteFile.mockRejectedValue(new Error('Permission denied'));

      const result = await fileUtils.writeFile(testPath, testContent);
      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileSystemError);
      expect(result.getError().message).toContain('Failed to write file');
    });

    it('should propagate directory creation errors', async () => {
      const testPath = 'subdir/file.txt';
      const testContent = 'file content';
      const error = new Error('Permission denied');

      mockEnsureDir.mockRejectedValue(error);

      const result = await fileUtils.writeFile(testPath, testContent);
      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileSystemError);
      expect(result.getError().message).toContain('Failed to create directory');
    });
  });

  describe('writeJsonFile', () => {
    it('should write JSON with pretty formatting by default', async () => {
      const testPath = 'file.json';
      const testData = { name: 'test', value: 123 };

      mockEnsureDir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const result = await fileUtils.writeJsonFile(testPath, testData);
      expect(result.isOk()).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(
        path.join(BASE_PATH, testPath),
        JSON.stringify(testData, null, 2),
        'utf-8'
      );
    });

    it('should write compact JSON when pretty=false', async () => {
      const testPath = 'file.json';
      const testData = { name: 'test', value: 123 };

      mockEnsureDir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const result = await fileUtils.writeJsonFile(testPath, testData, false);
      expect(result.isOk()).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(path.join(BASE_PATH, testPath), JSON.stringify(testData), 'utf-8');
    });
  });

  describe('fileExists', () => {
    it('should check if file exists with resolved path', async () => {
      const testPath = 'file.txt';
      mockAccess.mockResolvedValue(undefined);

      const result = await fileUtils.fileExists(testPath);
      expect(result).toBe(true);
      expect(mockAccess).toHaveBeenCalledWith(path.join(BASE_PATH, testPath));
    });

    it('should return false when file does not exist', async () => {
      const testPath = 'nonexistent.txt';
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const result = await fileUtils.fileExists(testPath);
      expect(result).toBe(false);
      expect(mockAccess).toHaveBeenCalledWith(path.join(BASE_PATH, testPath));
    });
  });

  describe('findFiles', () => {
    it('should find files matching pattern with resolved paths', async () => {
      const testDir = 'docs';
      const testPattern = /\.md$/;
      const resolvedDir = path.join(BASE_PATH, testDir);

      // Setup mocks for readdir to return different values based on path
      mockReaddir.mockImplementation((dirPath) => {
        if (dirPath === resolvedDir) {
          return Promise.resolve([
            { name: 'file1.md', isDirectory: () => false, isFile: () => true },
            { name: 'file2.txt', isDirectory: () => false, isFile: () => true },
            { name: 'subdir', isDirectory: () => true, isFile: () => false },
          ] as unknown as Dirent[]);
        }

        if (dirPath === path.join(resolvedDir, 'subdir')) {
          return Promise.resolve([
            { name: 'file3.md', isDirectory: () => false, isFile: () => true },
          ] as unknown as Dirent[]);
        }

        return Promise.resolve([] as unknown as Dirent[]);
      });

      const result = await fileUtils.findFiles(testDir, testPattern);
      expect(result.isOk()).toBe(true);
      expect(result.getValue()).toEqual([
        path.join(resolvedDir, 'file1.md'),
        path.join(resolvedDir, 'subdir', 'file3.md'),
      ]);
    });

    it('should return error when directory read fails', async () => {
      const testDir = 'docs';
      const testPattern = /\.md$/;

      mockReaddir.mockRejectedValue(new Error('Permission denied'));

      const result = await fileUtils.findFiles(testDir, testPattern);
      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileSystemError);
      expect(result.getError().message).toContain('Failed to find files');
    });
  });

  describe('getFileStats', () => {
    it('should return stats with resolved path when file exists', async () => {
      const testPath = 'file.txt';
      const mockStats = { size: 100, mtime: new Date() } as Stats;
      mockStat.mockResolvedValue(mockStats);

      const result = await fileUtils.getFileStats(testPath);
      expect(result).toBe(mockStats);
      expect(mockStat).toHaveBeenCalledWith(path.join(BASE_PATH, testPath));
    });

    it('should return null when file does not exist', async () => {
      const testPath = 'nonexistent.txt';
      mockStat.mockRejectedValue(new Error('ENOENT'));

      const result = await fileUtils.getFileStats(testPath);
      expect(result).toBeNull();
      expect(mockStat).toHaveBeenCalledWith(path.join(BASE_PATH, testPath));
    });
  });

  describe('getFileSize', () => {
    it('should return human-readable file size', () => {
      const testPath = 'file.txt';
      const mockStats = { size: 1536 } as Stats;
      mockStatSync.mockReturnValue(mockStats);

      const result = fileUtils.getFileSize(testPath);
      expect(result.isOk()).toBe(true);
      expect(result.getValue()).toBe('1.5 KB');
      expect(mockStatSync).toHaveBeenCalledWith(path.join(BASE_PATH, testPath));
    });

    it('should return bytes for small files', () => {
      const testPath = 'small.txt';
      const mockStats = { size: 100 } as Stats;
      mockStatSync.mockReturnValue(mockStats);

      const result = fileUtils.getFileSize(testPath);
      expect(result.isOk()).toBe(true);
      expect(result.getValue()).toBe('100.0 B');
    });

    it('should return error when stat fails', () => {
      const testPath = 'nonexistent.txt';
      mockStatSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const result = fileUtils.getFileSize(testPath);
      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileSystemError);
      expect(result.getError().message).toContain('Failed to get file size');
    });
  });

  describe('safeDeleteFile', () => {
    it('should delete file with resolved path and return true when file exists', async () => {
      const testPath = 'file.txt';
      mockUnlink.mockResolvedValue(undefined);

      const result = await fileUtils.safeDeleteFile(testPath);
      expect(result.isOk()).toBe(true);
      expect(result.getValue()).toBe(true);
      expect(mockUnlink).toHaveBeenCalledWith(path.join(BASE_PATH, testPath));
    });

    it('should return false when file does not exist', async () => {
      const testPath = 'nonexistent.txt';
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockUnlink.mockRejectedValue(error);

      const result = await fileUtils.safeDeleteFile(testPath);
      expect(result.isOk()).toBe(true);
      expect(result.getValue()).toBe(false);
      expect(mockUnlink).toHaveBeenCalledWith(path.join(BASE_PATH, testPath));
    });

    it('should return error for other unlink errors', async () => {
      const testPath = 'file.txt';
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EPERM';
      mockUnlink.mockRejectedValue(error);

      const result = await fileUtils.safeDeleteFile(testPath);
      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(FileSystemError);
      expect(result.getError().message).toContain('Failed to delete file');
    });
  });
});
