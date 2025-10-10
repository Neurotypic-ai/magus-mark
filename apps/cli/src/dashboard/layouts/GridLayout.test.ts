import { describe, expect, it, vi } from 'vitest';

import { GridLayout } from './GridLayout';

import type { LayoutConfig } from './GridLayout';

const mockScreen = {} as never;

vi.mock('blessed-contrib', () => ({
  default: {
    grid: class {
      constructor(_opts: unknown) {
        /* no-op */
      }
    },
  },
}));

describe('GridLayout', () => {
  it('validateLayout detects widgets exceeding grid bounds', () => {
    const config: LayoutConfig = {
      rows: 12,
      cols: 12,
      widgets: [
        { id: 'w1', type: 'progress', position: { x: 10, y: 10, width: 5, height: 2 }, title: 'A', dataSource: 'd' },
      ],
    };

    const layout = new GridLayout(mockScreen, config);
    expect(layout.validateLayout()).toBe(false);
  });

  it('validateLayout passes for valid widgets', () => {
    const config: LayoutConfig = {
      rows: 12,
      cols: 12,
      widgets: [
        { id: 'w1', type: 'progress', position: { x: 0, y: 0, width: 4, height: 2 }, title: 'A', dataSource: 'd' },
        { id: 'w2', type: 'graph', position: { x: 4, y: 0, width: 8, height: 4 }, title: 'B', dataSource: 'd' },
      ],
    };

    const layout = new GridLayout(mockScreen, config);
    expect(layout.validateLayout()).toBe(true);
  });

  it('optimizeLayout sorts widgets by size and repositions', () => {
    const config: LayoutConfig = {
      rows: 12,
      cols: 12,
      widgets: [
        { id: 'small', type: 'progress', position: { x: 0, y: 0, width: 2, height: 2 }, title: 'S', dataSource: 'd' },
        { id: 'large', type: 'graph', position: { x: 0, y: 0, width: 8, height: 4 }, title: 'L', dataSource: 'd' },
      ],
    };

    const layout = new GridLayout(mockScreen, config);
    const optimized = layout.optimizeLayout();

    expect(optimized.widgets[0]?.id).toBe('large');
    expect(optimized.widgets[1]?.id).toBe('small');
  });

  it('getWidgetPositions returns all widget positions', () => {
    const config: LayoutConfig = {
      rows: 12,
      cols: 12,
      widgets: [
        { id: 'w1', type: 'progress', position: { x: 0, y: 0, width: 4, height: 2 }, title: 'A', dataSource: 'd' },
        { id: 'w2', type: 'graph', position: { x: 4, y: 0, width: 4, height: 4 }, title: 'B', dataSource: 'd' },
      ],
    };

    const layout = new GridLayout(mockScreen, config);
    const positions = layout.getWidgetPositions();

    expect(positions['w1']).toEqual({ x: 0, y: 0, width: 4, height: 2 });
    expect(positions['w2']).toEqual({ x: 4, y: 0, width: 4, height: 4 });
  });
});
