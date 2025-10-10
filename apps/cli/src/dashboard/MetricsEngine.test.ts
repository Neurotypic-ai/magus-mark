import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MetricCollector, MetricsEngine } from './MetricsEngine';

import type { MetricData } from './MetricsEngine';

class TestCollector extends MetricCollector {
  public value = 0;
  async collect(): Promise<MetricData | null> {
    return this.createMetricData(this.value);
  }
}

describe('MetricsEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('starts and stops collection, emitting and storing data', async () => {
    const engine = new MetricsEngine();
    const cb = vi.fn();
    engine.subscribeToMetric('processing:progress', cb);

    engine.startCollection('processing:progress', 1000);
    await vi.advanceTimersByTimeAsync(1100);

    const history = engine.getHistoricalData('processing:progress');
    expect(cb).toHaveBeenCalled();
    expect(history.length).toBeGreaterThan(0);

    engine.stopCollection('processing:progress');
    const len = history.length;
    await vi.advanceTimersByTimeAsync(5000);
    expect(engine.getHistoricalData('processing:progress').length).toBe(len);
  });

  it('recordMetric stores history and trims to maxHistory', () => {
    const engine = new MetricsEngine();
    const collector = new TestCollector();
    engine.addCollector('custom', collector);
    engine.startCollection('custom', 1000);
    engine.stopCollection('custom');

    for (let i = 0; i < 1005; i++) {
      engine.recordMetric('custom', { timestamp: i, value: i });
    }

    const data = engine.getHistoricalData('custom');
    expect(data.length).toBe(1000);
    expect(data[0]?.value).toBe(5); // first 5 trimmed
    expect(engine.getLatestValue('custom')).toBe(1004);

    const stats = engine.getMetricStats('custom');
    expect(stats?.count).toBe(1000);
    expect(stats?.minimum).toBe(5);
    expect(stats?.maximum).toBe(1004);
    expect(stats?.average).toBeCloseTo(504.5, 5);
  });

  it('getHistoricalData respects timeRange filtering', () => {
    const engine = new MetricsEngine();
    const collector = new TestCollector();
    engine.addCollector('customRange', collector);
    engine.startCollection('customRange', 1000);
    engine.stopCollection('customRange');

    engine.recordMetric('customRange', { timestamp: 1000, value: 1 });
    engine.recordMetric('customRange', { timestamp: 2000, value: 2 });
    engine.recordMetric('customRange', { timestamp: 3000, value: 3 });

    const filtered = engine.getHistoricalData('customRange', {
      start: new Date(1500),
      end: new Date(2500),
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0]?.value).toBe(2);
  });

  it('subscribe and unsubscribe to metric events', () => {
    const engine = new MetricsEngine();
    const collector = new TestCollector();
    engine.addCollector('customSub', collector);
    engine.startCollection('customSub', 1000);
    engine.stopCollection('customSub');

    const cb = vi.fn();
    engine.subscribeToMetric('customSub', cb);
    engine.recordMetric('customSub', { timestamp: Date.now(), value: 42 });
    expect(cb).toHaveBeenCalledTimes(1);

    engine.unsubscribeFromMetric('customSub', cb);
    engine.recordMetric('customSub', { timestamp: Date.now(), value: 43 });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('cleanup clears intervals and streams and emits cleanup', async () => {
    const engine = new MetricsEngine();
    const cleanupSpy = vi.fn();
    engine.on('cleanup', cleanupSpy);

    engine.startCollection('processing:progress', 1000);
    await vi.advanceTimersByTimeAsync(1100);
    expect(engine.getHistoricalData('processing:progress').length).toBeGreaterThan(0);

    engine.cleanup();
    expect(engine.getHistoricalData('processing:progress').length).toBe(0);
    expect(cleanupSpy).toHaveBeenCalled();
  });

  it('getAllMetrics includes default metrics', () => {
    const engine = new MetricsEngine();
    const metrics = engine.getAllMetrics();
    const expected = [
      'processing:progress',
      'cost:updated',
      'tokens:usage',
      'api:latency',
      'system:log',
      'system:memory',
      'system:cpu',
    ];
    expected.forEach((m) => {
      expect(metrics).toContain(m);
    });
  });
});
