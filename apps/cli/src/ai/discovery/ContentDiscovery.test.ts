import * as fsPromises from 'node:fs/promises';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContentDiscovery } from './ContentDiscovery';

// Mock Logger to avoid real logging
vi.mock('@magus-mark/core/utils/Logger', () => ({
  Logger: {
    getInstance: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      box: vi.fn(),
      configure: vi.fn(),
    })),
  },
}));

// Mocks for fs.promises - must be inline to avoid hoisting issues
vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
  readFile: vi.fn(),
}));

interface DirLike {
  name: string;
  isFile: () => boolean;
  isDirectory: () => boolean;
}

const readdirMock = vi.mocked(fsPromises.readdir) as unknown as ReturnType<
  typeof vi.fn<(path: string, opts: { withFileTypes: true }) => Promise<DirLike[]>>
>;
const statMock = vi.mocked(fsPromises.stat) as unknown as ReturnType<
  typeof vi.fn<(path: string) => Promise<{ size: number; mtime: Date }>>
>;
const readFileMock = vi.mocked(fsPromises.readFile) as unknown as ReturnType<
  typeof vi.fn<(path: string, enc: string) => Promise<string>>
>;

function makeFile(name: string) {
  return { name, isFile: () => true, isDirectory: () => false };
}

function makeDir(name: string) {
  return { name, isFile: () => false, isDirectory: () => true };
}

describe('ContentDiscovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('discovers files and directories, respecting hidden and exclude filters', async () => {
    const root = '/root';

    // Directory structure:
    // /root: file.md, .hidden.md, skip.tmp, dir/
    readdirMock.mockResolvedValueOnce([
      makeFile('file.md'),
      makeFile('.hidden.md'),
      makeFile('skip.tmp'),
      makeDir('dir'),
    ]);

    // maxDepth = 0: should not recurse into /root/dir
    const fileStats = { size: 123, mtime: new Date('2024-01-01T00:00:00Z') };
    statMock.mockImplementation(async (p: string) => {
      if (p.endsWith('file.md') || p.endsWith('.hidden.md') || p.endsWith('skip.tmp')) return fileStats;
      if (p.endsWith('/dir')) return { size: 0, mtime: new Date('2024-01-02T00:00:00Z') };
      throw new Error(`unexpected stat path ${p}`);
    });

    // For previews only text files will be read; we expect file.md to be read.
    readFileMock.mockResolvedValue('hello world');

    const discovery = new ContentDiscovery({
      patterns: ['**/*.md'],
      excludePatterns: ['.*skip.*'],
      maxDepth: 0,
      followSymlinks: false,
      includeHidden: false,
    });

    const started: string[] = [];
    const items: string[] = [];
    let completed = false;

    discovery.on('discovery:started', (p: string) => started.push(p));
    discovery.on('discovery:item', (item: { path: string }) => items.push(item.path));
    discovery.on('discovery:completed', () => {
      completed = true;
    });

    const result = await discovery.discover(root);

    // Events emitted
    expect(started).toEqual([root]);
    expect(completed).toBe(true);

    // Files: file.md included, .hidden.md excluded, skip.tmp excluded by pattern
    const filePaths = result.files.map((f) => f.path);
    expect(filePaths).toContain('/root/file.md');
    expect(filePaths).not.toContain('/root/.hidden.md');
    expect(filePaths).not.toContain('/root/skip.tmp');

    // Directories: dir is listed even when not recursed due to depth
    const dirPaths = result.directories.map((d) => d.path);
    expect(dirPaths).toContain('/root/dir');

    // Items event should have fired for each discovered entry
    expect(items).toEqual(expect.arrayContaining(['/root/file.md', '/root/dir']));

    // Preview for text files
    const fileMd = result.files.find((f) => f.path.endsWith('file.md'));
    expect(fileMd?.contentPreview).toBe('hello world');

    // Summary
    expect(result.totalFound).toBe(result.files.length + result.directories.length);
    expect(result.errors).toEqual([]);
  });

  it('respects maxDepth when recursing into subdirectories', async () => {
    const root = '/root';

    // /root: dir/
    readdirMock.mockResolvedValueOnce([makeDir('dir')]);
    // /root/dir: nested.md, nested/
    readdirMock.mockResolvedValueOnce([makeFile('nested.md'), makeDir('nested')]);
    // /root/dir/nested: deep.md (should be skipped with maxDepth=1)
    // we will not be called due to maxDepth

    statMock.mockImplementation(async (_p: string) => ({ size: 1, mtime: new Date('2024-01-01T00:00:00Z') }));
    readFileMock.mockResolvedValue('nested content');

    const discovery = new ContentDiscovery({
      patterns: ['**/*'],
      excludePatterns: [],
      maxDepth: 1,
      followSymlinks: false,
      includeHidden: true,
    });

    const result = await discovery.discover(root);
    const files = result.files.map((f) => f.path);
    expect(files).toContain('/root/dir/nested.md');
    expect(files).not.toContain('/root/dir/nested/deep.md');
  });

  it('collects error messages when a file stat fails', async () => {
    const root = '/root';
    readdirMock.mockResolvedValueOnce([makeFile('good.md'), makeFile('bad.md')]);

    statMock.mockImplementation(async (p: string) => {
      if (p.endsWith('bad.md')) throw new Error('boom');
      return { size: 2, mtime: new Date('2024-01-01T00:00:00Z') };
    });
    readFileMock.mockResolvedValue('ok');

    const discovery = new ContentDiscovery({
      patterns: ['**/*'],
      excludePatterns: [],
      maxDepth: 0,
      followSymlinks: false,
      includeHidden: true,
    });

    const result = await discovery.discover(root);
    // One file succeeds, one fails
    const files = result.files.map((f) => f.path);
    expect(files).toContain('/root/good.md');
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toMatch(/Error processing \/root\/bad\.md: boom/);
  });

  it('generates truncated content preview for long text files', async () => {
    const root = '/root';
    readdirMock.mockResolvedValueOnce([makeFile('long.md')]);
    statMock.mockResolvedValue({ size: 2000, mtime: new Date('2024-01-01T00:00:00Z') });

    const longText = 'x'.repeat(205);
    readFileMock.mockResolvedValue(longText);

    const discovery = new ContentDiscovery({
      patterns: ['**/*'],
      excludePatterns: [],
      maxDepth: 0,
      followSymlinks: false,
      includeHidden: true,
    });

    const result = await discovery.discover(root);
    const file = result.files.find((f) => f.path.endsWith('long.md'));
    expect(file?.contentPreview?.length ?? 0).toBe(200 + 3); // 200 + '...'
    expect(file?.contentPreview?.endsWith('...')).toBe(true);
  });
});
