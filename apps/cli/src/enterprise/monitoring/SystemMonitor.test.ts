import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SystemMonitor } from './SystemMonitor';

import type { MonitoringConfig } from './SystemMonitor';

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

const mockMemoryUsage = vi.fn(() => ({
  rss: 100 * 1024 * 1024,
  heapTotal: 80 * 1024 * 1024,
  heapUsed: 60 * 1024 * 1024,
  external: 10 * 1024 * 1024,
  arrayBuffers: 5 * 1024 * 1024,
}));

const mockCpuUsage = vi.fn(() => ({ user: 1000000, system: 500000 }));

vi.spyOn(process, 'memoryUsage').mockImplementation(mockMemoryUsage);
vi.spyOn(process, 'cpuUsage').mockImplementation(mockCpuUsage);

describe('SystemMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts and stops monitoring', () => {
    const config: MonitoringConfig = {
      interval: 1000,
      enableCpuMonitoring: true,
      enableMemoryMonitoring: true,
      enableDiskMonitoring: true,
      enableNetworkMonitoring: true,
      thresholds: { cpu: 80, memory: 90, disk: 85 },
    };

    const monitor = new SystemMonitor(config);
    const startedSpy = vi.fn();
    const stoppedSpy = vi.fn();

    monitor.on('monitoring:started', startedSpy);
    monitor.on('monitoring:stopped', stoppedSpy);

    monitor.start();
    expect(startedSpy).toHaveBeenCalled();

    monitor.stop();
    expect(stoppedSpy).toHaveBeenCalled();

    const status = monitor.getStatus();
    expect(status.running).toBe(false);
  });

  it('collectMetrics returns all metric categories', () => {
    const config: MonitoringConfig = {
      interval: 1000,
      enableCpuMonitoring: true,
      enableMemoryMonitoring: true,
      enableDiskMonitoring: true,
      enableNetworkMonitoring: true,
      thresholds: { cpu: 80, memory: 90, disk: 85 },
    };

    const monitor = new SystemMonitor(config);
    const metrics = monitor.collectMetrics();

    expect(metrics).toHaveProperty('cpu');
    expect(metrics).toHaveProperty('memory');
    expect(metrics).toHaveProperty('disk');
    expect(metrics).toHaveProperty('network');
    expect(metrics).toHaveProperty('process');
  });

  it('emits threshold warnings when limits exceeded', () => {
    const config: MonitoringConfig = {
      interval: 1000,
      enableCpuMonitoring: true,
      enableMemoryMonitoring: true,
      enableDiskMonitoring: true,
      enableNetworkMonitoring: false,
      thresholds: { cpu: 0.1, memory: 0.1, disk: 50 },
    };

    const monitor = new SystemMonitor(config);
    const memoryThresholdSpy = vi.fn();

    monitor.on('threshold:memory', memoryThresholdSpy);

    monitor.collectMetrics();

    expect(memoryThresholdSpy).toHaveBeenCalled();
  });
});
