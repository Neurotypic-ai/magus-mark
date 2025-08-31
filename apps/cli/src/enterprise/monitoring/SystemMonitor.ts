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
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;
  private lastCpuUsage?: NodeJS.CpuUsage;
  private lastNetworkStats?: { bytesIn: number; bytesOut: number };

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
      void this.collectMetrics();
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

  async collectMetrics(): Promise<SystemMetrics> {
    const metrics: SystemMetrics = {
      cpu: await this.getCpuMetrics(),
      memory: this.getMemoryMetrics(),
      disk: await this.getDiskMetrics(),
      network: await this.getNetworkMetrics(),
      process: this.getProcessMetrics(),
    };

    this.emit('metrics:collected', metrics);
    this.checkThresholds(metrics);

    return metrics;
  }

  private async getCpuMetrics(): Promise<SystemMetrics['cpu']> {
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

  private async getDiskMetrics(): Promise<SystemMetrics['disk']> {
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

  private async getNetworkMetrics(): Promise<SystemMetrics['network']> {
    // Simplified network metrics - would integrate with system tools in production
    const current = {
      bytesIn: Math.random() * 1000000,
      bytesOut: Math.random() * 500000,
    };

    const metrics = {
      bytesIn: current.bytesIn,
      bytesOut: current.bytesOut,
      packetsIn: Math.floor(current.bytesIn / 1500), // Approximate packets
      packetsOut: Math.floor(current.bytesOut / 1500),
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
