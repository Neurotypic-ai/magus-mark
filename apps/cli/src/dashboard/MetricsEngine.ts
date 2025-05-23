import { EventEmitter } from 'events';

export interface MetricData {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface MetricStream {
  metric: string;
  interval: number;
  lastValue?: number;
  history: MetricData[];
  maxHistory: number;
}

export type MetricCallback = (data: MetricData) => void;

export class MetricsEngine extends EventEmitter {
  private collectors = new Map<string, MetricCollector>();
  private streams = new Map<string, MetricStream>();
  private activeIntervals = new Map<string, NodeJS.Timeout>();

  constructor() {
    super();
    this.initializeDefaultMetrics();
  }

  private initializeDefaultMetrics(): void {
    // Initialize built-in metric collectors
    this.addCollector('processing:progress', new ProcessingProgressCollector());
    this.addCollector('cost:updated', new CostTrackingCollector());
    this.addCollector('tokens:usage', new TokenUsageCollector());
    this.addCollector('api:latency', new APILatencyCollector());
    this.addCollector('system:log', new SystemLogCollector());
    this.addCollector('system:memory', new SystemMemoryCollector());
    this.addCollector('system:cpu', new SystemCPUCollector());
  }

  addCollector(metric: string, collector: MetricCollector): void {
    this.collectors.set(metric, collector);
    collector.on('data', (data: MetricData) => {
      this.recordMetric(metric, data);
    });
  }

  startCollection(metric: string, interval: number): void {
    const collector = this.collectors.get(metric);
    if (!collector) {
      throw new Error(`Unknown metric: ${metric}`);
    }

    // Create stream if it doesn't exist
    if (!this.streams.has(metric)) {
      this.streams.set(metric, {
        metric,
        interval,
        history: [],
        maxHistory: 1000, // Keep last 1000 data points
      });
    }

    // Start collection interval
    const intervalId = setInterval(() => {
      collector.collect().then((data) => {
        if (data) {
          this.recordMetric(metric, data);
        }
      });
    }, interval);

    this.activeIntervals.set(metric, intervalId);
  }

  stopCollection(metric: string): void {
    const intervalId = this.activeIntervals.get(metric);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeIntervals.delete(metric);
    }
  }

  recordMetric(metric: string, data: MetricData): void {
    const stream = this.streams.get(metric);
    if (stream) {
      // Add to history
      stream.history.push(data);
      stream.lastValue = data.value;

      // Trim history if needed
      if (stream.history.length > stream.maxHistory) {
        stream.history.shift();
      }
    }

    // Emit the metric update
    this.emit(metric, data);
  }

  getHistoricalData(metric: string, timeRange?: TimeRange): MetricData[] {
    const stream = this.streams.get(metric);
    if (!stream) return [];

    let data = stream.history;

    if (timeRange) {
      data = data.filter(
        (point) => point.timestamp >= timeRange.start.getTime() && point.timestamp <= timeRange.end.getTime()
      );
    }

    return data;
  }

  getLatestValue(metric: string): number | undefined {
    const stream = this.streams.get(metric);
    return stream?.lastValue;
  }

  subscribeToMetric(metric: string, callback: MetricCallback): void {
    this.on(metric, callback);
  }

  unsubscribeFromMetric(metric: string, callback: MetricCallback): void {
    this.off(metric, callback);
  }

  getMetricStats(metric: string): MetricStats | undefined {
    const stream = this.streams.get(metric);
    if (!stream || stream.history.length === 0) return undefined;

    const values = stream.history.map((point) => point.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      metric,
      count: values.length,
      average: avg,
      minimum: min,
      maximum: max,
      current: stream.lastValue || 0,
    };
  }

  getAllMetrics(): string[] {
    return Array.from(this.collectors.keys());
  }

  cleanup(): void {
    // Stop all intervals
    this.activeIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.activeIntervals.clear();

    // Clear all streams
    this.streams.clear();

    this.emit('cleanup');
  }
}

export interface MetricStats {
  metric: string;
  count: number;
  average: number;
  minimum: number;
  maximum: number;
  current: number;
}

// Base class for metric collectors
export abstract class MetricCollector extends EventEmitter {
  abstract collect(): Promise<MetricData | null>;

  protected createMetricData(value: number, tags?: Record<string, string>): MetricData {
    return {
      timestamp: Date.now(),
      value,
      tags,
    };
  }
}

// Built-in metric collectors
class ProcessingProgressCollector extends MetricCollector {
  private progress = 0;

  async collect(): Promise<MetricData | null> {
    return this.createMetricData(this.progress);
  }

  updateProgress(progress: number): void {
    this.progress = progress;
    this.emit('data', this.createMetricData(progress));
  }
}

class CostTrackingCollector extends MetricCollector {
  private totalCost = 0;

  async collect(): Promise<MetricData | null> {
    return this.createMetricData(this.totalCost);
  }

  addCost(cost: number): void {
    this.totalCost += cost;
    this.emit('data', this.createMetricData(this.totalCost));
  }
}

class TokenUsageCollector extends MetricCollector {
  private tokenHistory: { timestamp: number; tokens: number }[] = [];

  async collect(): Promise<MetricData | null> {
    const now = Date.now();
    // Calculate tokens per minute over last 5 minutes
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const recentTokens = this.tokenHistory
      .filter((entry) => entry.timestamp > fiveMinutesAgo)
      .reduce((sum, entry) => sum + entry.tokens, 0);

    return this.createMetricData(recentTokens);
  }

  recordTokens(tokens: number): void {
    const now = Date.now();
    this.tokenHistory.push({ timestamp: now, tokens });

    // Keep only last hour of data
    const oneHourAgo = now - 60 * 60 * 1000;
    this.tokenHistory = this.tokenHistory.filter((entry) => entry.timestamp > oneHourAgo);

    this.emit('data', this.createMetricData(tokens));
  }
}

class APILatencyCollector extends MetricCollector {
  private latencies: number[] = [];

  async collect(): Promise<MetricData | null> {
    if (this.latencies.length === 0) return this.createMetricData(0);

    const avg = this.latencies.reduce((sum, lat) => sum + lat, 0) / this.latencies.length;
    return this.createMetricData(avg);
  }

  recordLatency(latency: number): void {
    this.latencies.push(latency);

    // Keep only last 100 latencies
    if (this.latencies.length > 100) {
      this.latencies.shift();
    }

    this.emit('data', this.createMetricData(latency));
  }
}

class SystemLogCollector extends MetricCollector {
  private logCount = 0;

  async collect(): Promise<MetricData | null> {
    return this.createMetricData(this.logCount);
  }

  recordLog(level: string, message: string): void {
    this.logCount++;
    this.emit('data', this.createMetricData(this.logCount, { level, message }));
  }
}

class SystemMemoryCollector extends MetricCollector {
  async collect(): Promise<MetricData | null> {
    const memUsage = process.memoryUsage();
    return this.createMetricData(memUsage.heapUsed / 1024 / 1024); // MB
  }
}

class SystemCPUCollector extends MetricCollector {
  private lastCpuUsage = process.cpuUsage();

  async collect(): Promise<MetricData | null> {
    const currentUsage = process.cpuUsage(this.lastCpuUsage);
    const totalUsage = currentUsage.user + currentUsage.system;
    const cpuPercent = totalUsage / 1000 / 1000; // Convert to percentage approximation

    this.lastCpuUsage = process.cpuUsage();
    return this.createMetricData(cpuPercent);
  }
}
