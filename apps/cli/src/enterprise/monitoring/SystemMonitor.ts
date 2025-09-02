import { EventEmitter } from 'events';
import * as os from 'os';

import { Logger } from '@magus-mark/core/utils/Logger';

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

export interface MonitoringConfig {
  interval: number;
  enableCpuMonitoring: boolean;
  enableMemoryMonitoring: boolean;
  enableDiskMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  thresholds: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

export class SystemMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private logger: Logger;
  private intervalId?: NodeJS.Timeout | undefined;
  private isRunning = false;
  private lastCpuUsage?: NodeJS.CpuUsage;
  private lastNetworkStats?: { bytesIn: number; bytesOut: number; timestamp: number };

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
    this.logger = Logger.getInstance('system-monitor');
    this.lastCpuUsage = process.cpuUsage();
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.logger.info('Starting system monitoring');
    this.isRunning = true;

    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, this.config.interval);

    this.emit('monitoring:started');
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.logger.info('Stopping system monitoring');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.isRunning = false;
    this.emit('monitoring:stopped');
  }

  collectMetrics(): SystemMetrics {
    const metrics: SystemMetrics = {
      cpu: this.getCpuMetrics(),
      memory: this.getMemoryMetrics(),
      disk: this.getDiskMetrics(),
      network: this.getNetworkMetrics(),
      process: this.getProcessMetrics(),
    };

    this.emit('metrics:collected', metrics);
    this.checkThresholds(metrics);

    return metrics;
  }

  private getCpuMetrics(): SystemMetrics['cpu'] {
    const cores = os.cpus().length;
    const loadAverage = os.loadavg();

    // Calculate CPU usage based on process.cpuUsage()
    const currentUsage = process.cpuUsage(this.lastCpuUsage);
    const usage = (currentUsage.user + currentUsage.system) / 1000000; // Convert to seconds
    this.lastCpuUsage = process.cpuUsage();

    return {
      cores,
      loadAverage,
      usage: Math.min(usage * 100, 100), // Convert to percentage
    };
  }

  private getMemoryMetrics(): SystemMetrics['memory'] {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usage = (used / total) * 100;

    return {
      total,
      used,
      free,
      usage,
    };
  }

  private getDiskMetrics(): SystemMetrics['disk'] {
    // Simplified disk metrics - in production would use statvfs or similar
    const total = 1000 * 1024 * 1024 * 1024; // 1TB placeholder
    const used = total * 0.6; // 60% used placeholder
    const free = total - used;
    const usage = (used / total) * 100;

    return {
      total,
      used,
      free,
      usage,
    };
  }

  private getNetworkMetrics(): SystemMetrics['network'] {
    // Simplified network metrics - would integrate with system tools in production
    const now = Date.now();
    const current = {
      bytesIn: Math.random() * 1000000,
      bytesOut: Math.random() * 500000,
      timestamp: now,
    };

    // Calculate rates if we have previous data
    let actualBytesIn = current.bytesIn;
    let actualBytesOut = current.bytesOut;

    if (this.lastNetworkStats) {
      const timeDelta = (now - this.lastNetworkStats.timestamp) / 1000; // seconds
      actualBytesIn = Math.max(0, (current.bytesIn - this.lastNetworkStats.bytesIn) / timeDelta);
      actualBytesOut = Math.max(0, (current.bytesOut - this.lastNetworkStats.bytesOut) / timeDelta);
    }

    const metrics = {
      bytesIn: actualBytesIn,
      bytesOut: actualBytesOut,
      packetsIn: Math.floor(actualBytesIn / 1500), // Approximate packets
      packetsOut: Math.floor(actualBytesOut / 1500),
    };

    this.lastNetworkStats = current;
    return metrics;
  }

  private getProcessMetrics(): SystemMetrics['process'] {
    return {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };
  }

  private checkThresholds(metrics: SystemMetrics): void {
    // Check CPU threshold
    if (this.config.enableCpuMonitoring && metrics.cpu.usage > this.config.thresholds.cpu) {
      this.logger.warn(`High CPU usage detected: ${metrics.cpu.usage.toFixed(1)}%`);
      this.emit('threshold:cpu', metrics.cpu);
    }

    // Check memory threshold
    if (this.config.enableMemoryMonitoring && metrics.memory.usage > this.config.thresholds.memory) {
      this.logger.warn(`High memory usage detected: ${metrics.memory.usage.toFixed(1)}%`);
      this.emit('threshold:memory', metrics.memory);
    }

    // Check disk threshold
    if (this.config.enableDiskMonitoring && metrics.disk.usage > this.config.thresholds.disk) {
      this.logger.warn(`High disk usage detected: ${metrics.disk.usage.toFixed(1)}%`);
      this.emit('threshold:disk', metrics.disk);
    }
  }

  getStatus(): { running: boolean; uptime: number; lastCollection?: Date } {
    return {
      running: this.isRunning,
      uptime: process.uptime(),
      lastCollection: new Date(),
    };
  }
}
