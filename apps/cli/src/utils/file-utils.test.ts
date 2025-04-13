import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    statSync: vi.fn(),
    readdirSync: vi.fn()
  }
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  stat: vi.fn()
}));

// Import after mocks
import { findFiles, readMarkdownFile, writeMarkdownFile } from '../../src/utils/file-utils';

describe('File Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findFiles', () => {
    it('should find all markdown files in a directory', async () => {
      // Setup mock return values
      const mockReaddir = vi.mocked(require('fs/promises').readdir);
      const mockStat = vi.mocked(require('fs/promises').stat);
      
      // Mock directory contents
      mockReaddir.mockResolvedValueOnce(['file1.md', 'file2.txt', 'file3.md', 'subdir']);
      
      // Mock file stats
      mockStat.mockImplementation((path) => {
        if (path.endsWith('subdir')) {
          return Promise.resolve({ isFile: () => false, isDirectory: () => true });
        }
        return Promise.resolve({ isFile: () => true, isDirectory: () => false });
      });
      
      // Mock subdirectory contents
      mockReaddir.mockResolvedValueOnce(['file4.md', 'file5.txt']);
      
      // Call function
      const files = await findFiles('test-dir', '.md');
      
      // Verify results
      expect(files).toContain(path.join('test-dir', 'file1.md'));
      expect(files).toContain(path.join('test-dir', 'file3.md'));
      expect(files).toContain(path.join('test-dir', 'subdir', 'file4.md'));
      expect(files).not.toContain(path.join('test-dir', 'file2.txt'));
      expect(files).not.toContain(path.join('test-dir', 'subdir', 'file5.txt'));
    });
    
    it('should handle empty directories', async () => {
      // Setup mock return values
      const mockReaddir = vi.mocked(require('fs/promises').readdir);
      
      // Mock empty directory
      mockReaddir.mockResolvedValueOnce([]);
      
      // Call function
      const files = await findFiles('empty-dir', '.md');
      
      // Verify results
      expect(files).toEqual([]);
    });
    
    it('should handle errors gracefully', async () => {
      // Setup mock to throw error
      const mockReaddir = vi.mocked(require('fs/promises').readdir);
      mockReaddir.mockRejectedValueOnce(new Error('Permission denied'));
      
      // Call function and expect it to handle the error
      const files = await findFiles('invalid-dir', '.md');
      
      // Verify results
      expect(files).toEqual([]);
    });
  });
  
  describe('readMarkdownFile', () => {
    it('should read and parse markdown file content', async () => {
      // Setup mock return values
      const mockReadFileSync = vi.mocked(fs.readFileSync);
      mockReadFileSync.mockReturnValueOnce(`---
title: Test Document
tags: [test, markdown]
---

# Test Document

This is a test document.`);
      
      // Call function
      const result = await readMarkdownFile('test.md');
      
      // Verify results
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('frontmatter');
      expect(result.frontmatter).toHaveProperty('title', 'Test Document');
      expect(result.frontmatter).toHaveProperty('tags');
      expect(result.content).toContain('# Test Document');
    });
    
    it('should handle files without frontmatter', async () => {
      // Setup mock return values
      const mockReadFileSync = vi.mocked(fs.readFileSync);
      mockReadFileSync.mockReturnValueOnce('# No Frontmatter\n\nThis file has no frontmatter.');
      
      // Call function
      const result = await readMarkdownFile('no-frontmatter.md');
      
      // Verify results
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('frontmatter');
      expect(result.frontmatter).toEqual({});
      expect(result.content).toContain('# No Frontmatter');
    });
    
    it('should handle file read errors', async () => {
      // Setup mock to throw error
      const mockReadFileSync = vi.mocked(fs.readFileSync);
      mockReadFileSync.mockImplementationOnce(() => {
        throw new Error('File not found');
      });
      
      // Call function and expect it to throw
      await expect(readMarkdownFile('non-existent.md')).rejects.toThrow();
    });
  });
  
  describe('writeMarkdownFile', () => {
    it('should write content and frontmatter to file', async () => {
      // Setup test data
      const filePath = 'test-output.md';
      const content = '# Test Document\n\nThis is a test document.';
      const frontmatter = {
        title: 'Test Document',
        tags: ['test', 'markdown']
      };
      
      // Call function
      await writeMarkdownFile(filePath, content, frontmatter);
      
      // Verify writeFileSync was called with correct parameters
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        filePath,
        expect.stringContaining('title: Test Document'),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        filePath,
        expect.stringContaining('tags: [test, markdown]'),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        filePath,
        expect.stringContaining('# Test Document'),
        'utf-8'
      );
    });
    
    it('should handle empty frontmatter', async () => {
      // Setup test data
      const filePath = 'test-output.md';
      const content = '# Test Document\n\nThis is a test document.';
      
      // Call function with no frontmatter
      await writeMarkdownFile(filePath, content);
      
      // Verify writeFileSync was called without frontmatter section
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        filePath,
        content,
        'utf-8'
      );
      expect(fs.writeFileSync).not.toHaveBeenCalledWith(
        filePath,
        expect.stringContaining('---'),
        'utf-8'
      );
    });
    
    it('should handle write errors', async () => {
      // Setup mock to throw error
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });
      
      // Call function and expect it to throw
      await expect(writeMarkdownFile('protected.md', 'content')).rejects.toThrow();
    });
  });
}); 