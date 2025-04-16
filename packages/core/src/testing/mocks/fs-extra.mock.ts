import { vi } from 'vitest';

/**
 * Creates a mock for fs-extra with customizable behaviors
 *
 * @returns An object containing all mocked fs-extra functions
 */
export const createFsExtraMock = () => {
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
export const setupFsExtraMock = () => {
  const { getMock } = createFsExtraMock();

  vi.mock('fs-extra', () => getMock());

  return { mockFsExtra: getMock() };
};
