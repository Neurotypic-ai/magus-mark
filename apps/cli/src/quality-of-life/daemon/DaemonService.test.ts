import { promises as fs } from 'fs';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DaemonService } from './DaemonService';

import type { DaemonConfig } from './DaemonService';

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

vi.mock('fs', () => ({
  promises: {
    writeFile: vi.fn(),
    unlink: vi.fn(),
    mkdir: vi.fn(),
    watch: vi.fn(() => ({ close: vi.fn() })),
  },
}));

const writeFileMock = vi.mocked(fs.writeFile);
const unlinkMock = vi.mocked(fs.unlink);
const watchMock = vi.mocked(fs.watch);

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
