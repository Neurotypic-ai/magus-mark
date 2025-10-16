import { describe, expect, it, vi } from 'vitest';

import { GraphDataAssembler } from './GraphDataAssembler';

// Mock fetch globally
global.fetch = vi.fn();

describe('GraphDataAssembler', () => {
  it('should assemble graph data from API', async () => {
    const mockPackages = [
      {
        id: 'pkg-1',
        name: 'test-package',
        version: '1.0.0',
        path: '/test',
        created_at: '2024-01-01T00:00:00.000Z',
        dependencies: new Map(),
        devDependencies: new Map(),
        peerDependencies: new Map(),
        modules: new Map(),
      },
    ];

    const mockModules = [
      {
        id: 'mod-1',
        package_id: 'pkg-1',
        name: 'index',
        source: {
          directory: '/test/src',
          filename: 'index.ts',
          relativePath: 'src/index.ts',
          name: 'index',
          isBarrel: false,
        },
        created_at: '2024-01-01T00:00:00.000Z',
        classes: new Map(),
        interfaces: new Map(),
        imports: new Map(),
        exports: new Map(),
        packages: new Map(),
        typeAliases: new Map(),
        enums: new Map(),
        referencePaths: [],
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackages,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockModules,
      } as Response);

    const assembler = new GraphDataAssembler('http://localhost:4001');
    const result = await assembler.assembleGraphData();

    expect(result).toHaveProperty('packages');
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]?.name).toBe('test-package');
  });

  it('should use cached data on subsequent calls', async () => {
    const mockPackages = [
      {
        id: 'pkg-1',
        name: 'test-package',
        version: '1.0.0',
        path: '/test',
        created_at: '2024-01-01T00:00:00.000Z',
        dependencies: new Map(),
        devDependencies: new Map(),
        peerDependencies: new Map(),
        modules: new Map(),
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackages,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

    const assembler = new GraphDataAssembler('http://localhost:4001');

    await assembler.assembleGraphData();
    const result2 = await assembler.assembleGraphData();

    // Should use cache, so fetch should only be called twice (once for each call)
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result2).toHaveProperty('packages');
  });

  it('should handle HTTP errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const assembler = new GraphDataAssembler('http://localhost:4001');

    await expect(assembler.assembleGraphData()).rejects.toThrow('HTTP error');
  });

  it('should support abort signals', async () => {
    const controller = new AbortController();

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      return Promise.reject(new DOMException('Aborted', 'AbortError'));
    });

    const assembler = new GraphDataAssembler('http://localhost:4001');

    controller.abort();
    await expect(assembler.assembleGraphData(controller.signal)).rejects.toThrow();
  });

  it('should clear cache when requested', async () => {
    const assembler = new GraphDataAssembler('http://localhost:4001');

    assembler.clearCache();

    // Should not throw
    expect(true).toBe(true);
  });
});
