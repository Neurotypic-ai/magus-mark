import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardManager } from './DashboardManager';

import type { DashboardConfig } from './DashboardManager';

// Headless mocks for blessed and blessed-contrib
const keyBindings: Record<string, () => void> = {};

vi.mock('blessed', () => ({
  default: {
    screen: vi.fn(() => ({
      key: (keys: string[] | string, handler: () => void) => {
        const arr = Array.isArray(keys) ? keys : [keys];
        arr.forEach((k) => {
          keyBindings[k] = handler;
        });
      },
      render: vi.fn(),
    })),
    message: vi.fn(() => ({
      display: (_text: string, _ms: number, cb: () => void) => {
        cb();
      },
    })),
  },
}));

vi.mock('blessed-contrib', () => {
  // All symbols and functions inside factory to avoid hoisting issues
  const LCD = Symbol('lcd');
  const LINE = Symbol('line');
  const GAUGE = Symbol('gauge');
  const LOG = Symbol('log');
  const DONUT = Symbol('donut');

  const createLcdWidget = () => ({ setDisplay: vi.fn() });
  const createLineWidget = () => ({ setData: vi.fn() });
  const createGaugeWidget = () => ({ setPercent: vi.fn() });
  const createLogWidget = () => ({ log: vi.fn() });
  const createDonutWidget = () => ({ setData: vi.fn() });

  return {
    default: {
      grid: class {
        constructor(_opts: unknown) {
          /* no-op */
        }
        set(_y: number, _x: number, _h: number, _w: number, component: unknown) {
          if (component === LCD) return createLcdWidget();
          if (component === LINE) return createLineWidget();
          if (component === GAUGE) return createGaugeWidget();
          if (component === LOG) return createLogWidget();
          if (component === DONUT) return createDonutWidget();
          return {};
        }
      },
      lcd: LCD,
      line: LINE,
      gauge: GAUGE,
      log: LOG,
      donut: DONUT,
    },
  };
});

function createConfig(): DashboardConfig {
  return {
    layout: 'grid',
    refreshRate: 500,
    theme: 'matrix',
    widgets: [
      {
        id: 'processing-status',
        type: 'progress',
        position: { x: 0, y: 0, width: 4, height: 2 },
        title: 'p',
        dataSource: 'processing:progress',
      },
      {
        id: 'cost-tracker',
        type: 'metrics',
        position: { x: 4, y: 0, width: 4, height: 2 },
        title: 'c',
        dataSource: 'cost:updated',
      },
      {
        id: 'token-usage',
        type: 'graph',
        position: { x: 8, y: 0, width: 4, height: 4 },
        title: 't',
        dataSource: 'tokens:usage',
      },
      {
        id: 'api-latency',
        type: 'graph',
        position: { x: 0, y: 2, width: 8, height: 4 },
        title: 'a',
        dataSource: 'api:latency',
      },
      {
        id: 'system-memory',
        type: 'chart',
        position: { x: 8, y: 4, width: 4, height: 4 },
        title: 'm',
        dataSource: 'system:memory',
      },
      {
        id: 'system-log',
        type: 'log',
        position: { x: 0, y: 6, width: 12, height: 6 },
        title: 'l',
        dataSource: 'system:log',
      },
    ],
  };
}

describe('DashboardManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.keys(keyBindings).forEach((k) => {
      delete keyBindings[k];
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates widgets and updates them by type', () => {
    const config = createConfig();
    const dashboard = new DashboardManager(config);
    dashboard.startDashboard();

    // Progress
    dashboard.updateWidget('processing-status', { percent: 55 });
    const progressWidget = dashboard.getWidgetById('processing-status') as unknown as {
      setPercent: (n: number) => void;
    };
    expect(progressWidget.setPercent).toHaveBeenCalledWith(55);

    // Metrics (lcd)
    dashboard.updateWidget('cost-tracker', { value: 123 });
    const lcdWidget = dashboard.getWidgetById('cost-tracker') as unknown as { setDisplay: (n: number) => void };
    expect(lcdWidget.setDisplay).toHaveBeenCalledWith(123);

    // Graph (line)
    const series = [{ title: 's', x: [0, 1], y: [1, 2], style: { line: 'red' } }];
    dashboard.updateWidget('token-usage', { series });
    const lineWidget = dashboard.getWidgetById('token-usage') as unknown as { setData: (s: unknown) => void };
    expect(lineWidget.setData).toHaveBeenCalledWith(series);

    // Chart (donut)
    const donutData = [{ label: 'Used', percent: 60, color: 'green' }];
    dashboard.updateWidget('system-memory', { data: donutData });
    const donutWidget = dashboard.getWidgetById('system-memory') as unknown as { setData: (d: unknown) => void };
    expect(donutWidget.setData).toHaveBeenCalledWith(donutData);

    // Log
    dashboard.updateWidget('system-log', { message: 'hello' });
    const logWidget = dashboard.getWidgetById('system-log') as unknown as { log: (m: string) => void };
    expect(logWidget.log).toHaveBeenCalledWith('hello');
  });

  it('cycles theme via keybinding and emits event', () => {
    const config = createConfig();
    const dashboard = new DashboardManager(config);
    const themeSpy = vi.fn();
    dashboard.on('theme:changed', themeSpy);

    dashboard.startDashboard();
    // Trigger 't' key
    keyBindings['t']?.();
    expect(themeSpy).toHaveBeenCalled();
  });

  it('refresh loop emits widget:refresh and cleanup stops it', () => {
    const config = createConfig();
    const dashboard = new DashboardManager(config);
    const refreshSpy = vi.fn();
    dashboard.on('widget:refresh', refreshSpy);

    dashboard.startDashboard();
    vi.advanceTimersByTime(config.refreshRate + 10);
    expect(refreshSpy).toHaveBeenCalled();

    dashboard.cleanup();
    const callCount = refreshSpy.mock.calls.length;
    vi.advanceTimersByTime(config.refreshRate * 3);
    expect(refreshSpy.mock.calls.length).toBe(callCount);
  });
});
