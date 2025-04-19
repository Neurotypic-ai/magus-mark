import { vi } from 'vitest';

/**
 * Creates a mock for fs-extra with customizable behaviors
 *
 * @returns An object containing all mocked fs-extra functions
 */
export const createFsExtraMock = (): { mockFunctions: FsExtraMockFunctions; getMock: () => FsExtraMockFunctions } => {
  const mockEnsureDir = vi.fn();
  const mockReadFile = vi.fn();
  const mockWriteFile = vi.fn();
  const mockAccess = vi.fn();
  const mockReaddir = vi.fn();
  const mockStat = vi.fn();
  const mockUnlink = vi.fn();
  const mockStatSync = vi.fn();

  return {
    mockFunctions: {
      ensureDir: mockEnsureDir,
      readFile: mockReadFile,
      writeFile: mockWriteFile,
      access: mockAccess,
      readdir: mockReaddir,
      stat: mockStat,
      unlink: mockUnlink,
      statSync: mockStatSync,
    },

    getMock: () => ({
      ensureDir: mockEnsureDir,
      readFile: mockReadFile,
      writeFile: mockWriteFile,
      access: mockAccess,
      readdir: mockReaddir,
      stat: mockStat,
      unlink: mockUnlink,
      statSync: mockStatSync,
    }),
  };
};

/**
 * Sets up a mock for fs-extra with default behavior
 */
export const setupFsExtraMock = (): { mockFsExtra: FsExtraMockFunctions } => {
  const { getMock } = createFsExtraMock();

  vi.mock('fs-extra', () => getMock());

  return { mockFsExtra: getMock() };
};

// Define explicit types so TS can emit declarations under --isolatedDeclarations
interface FsExtraMockFunctions {
  ensureDir: ReturnType<typeof vi.fn>;
  readFile: ReturnType<typeof vi.fn>;
  writeFile: ReturnType<typeof vi.fn>;
  access: ReturnType<typeof vi.fn>;
  readdir: ReturnType<typeof vi.fn>;
  stat: ReturnType<typeof vi.fn>;
  unlink: ReturnType<typeof vi.fn>;
  statSync: ReturnType<typeof vi.fn>;
}
