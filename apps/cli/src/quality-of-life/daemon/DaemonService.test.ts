import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DaemonService } from './DaemonService';

import type { DaemonConfig } from './DaemonService';

// Use vi.hoisted to create mocks that can be referenced in vi.mock factories
const { watchMock, writeFileMock, unlinkMock, mkdirMock, accessMock, readFileMock } = vi.hoisted(() => {
  return {
    watchMock: vi.fn(() => ({ close: vi.fn() })),
    writeFileMock: vi.fn().mockResolvedValue(undefined),
    unlinkMock: vi.fn().mockResolvedValue(undefined),
    mkdirMock: vi.fn().mockResolvedValue(undefined),
    accessMock: vi.fn().mockResolvedValue(undefined),
    readFileMock: vi.fn().mockResolvedValue(String(process.pid)),
  };
});

vi.mock('@magus-mark/core/utils/Logger', () => ({
  Logger: {
    getInstance: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

// Mock node:fs with both default and named exports for namespace imports
vi.mock('node:fs', () => {
  const mockFsModule = {
    watch: watchMock,
  };
  return {
    default: mockFsModule,
    ...mockFsModule,
  };
});

// Mock node:fs/promises with both default and named exports for namespace imports
vi.mock('node:fs/promises', () => {
  const mockFsPromisesModule = {
    writeFile: writeFileMock,
    unlink: unlinkMock,
    mkdir: mkdirMock,
    access: accessMock,
    readFile: readFileMock,
  };
  return {
    default: mockFsPromisesModule,
    ...mockFsPromisesModule,
  };
});

describe('DaemonService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts daemon and writes PID file', async () => {
    const config: DaemonConfig = {
      name: 'test-daemon',
      pidFile: '/tmp/test.pid',
      logFile: '/tmp/test.log',
      watchDirectories: [],
      processInterval: 1000,
      autoRestart: false,
    };

    const daemon = new DaemonService(config);
    const startedSpy = vi.fn();
    daemon.on('daemon:started', startedSpy);

    await daemon.start();

    expect(writeFileMock).toHaveBeenCalledWith('/tmp/test.pid', expect.any(String));
    expect(startedSpy).toHaveBeenCalled();
    expect(daemon.getStatus().running).toBe(true);
  });

  it('stops daemon and removes PID file', async () => {
    const config: DaemonConfig = {
      name: 'test-daemon',
      pidFile: '/tmp/test.pid',
      logFile: '/tmp/test.log',
      watchDirectories: [],
      processInterval: 1000,
      autoRestart: false,
    };

    const daemon = new DaemonService(config);
    await daemon.start();

    const stoppedSpy = vi.fn();
    daemon.on('daemon:stopped', stoppedSpy);

    await daemon.stop();

    expect(unlinkMock).toHaveBeenCalledWith('/tmp/test.pid');
    expect(stoppedSpy).toHaveBeenCalled();
    expect(daemon.getStatus().running).toBe(false);
  });

  it('sets up watchers for configured directories', async () => {
    const config: DaemonConfig = {
      name: 'test-daemon',
      pidFile: '/tmp/test.pid',
      logFile: '/tmp/test.log',
      watchDirectories: ['/watch1', '/watch2'],
      processInterval: 1000,
      autoRestart: false,
    };

    const daemon = new DaemonService(config);
    await daemon.start();

    expect(watchMock).toHaveBeenCalledTimes(2);
  });
});
