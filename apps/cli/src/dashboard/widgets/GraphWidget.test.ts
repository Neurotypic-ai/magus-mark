import { describe, expect, it, vi } from 'vitest';

import { GraphWidget } from './GraphWidget';

import type { WidgetConfig } from '../DashboardManager';
import type { GraphSeries } from './GraphWidget';

// Mock blessed-contrib
const mockLineWidget = {
  setData: vi.fn(),
};

const mockGrid = {
  set: vi.fn(() => mockLineWidget),
};

vi.mock('blessed-contrib', () => ({
  default: {
    line: Symbol('line'),
  },
}));

describe('GraphWidget', () => {
  it('processes series data capping to maxDataPoints', () => {
    const config: WidgetConfig = {
      id: 'test-graph',
      type: 'graph',
      position: { x: 0, y: 0, width: 4, height: 4 },
      title: 'Test Graph',
      dataSource: 'test:data',
    };

    const widget = new GraphWidget(config, mockGrid as never);

    const longSeries: GraphSeries[] = [
      {
        title: 'Long',
        x: Array.from({ length: 100 }, (_, i) => i),
        y: Array.from({ length: 100 }, (_, i) => i * 2),
        style: { line: 'red' },
      },
    ];

    widget.update({ series: longSeries });

    expect(mockLineWidget.setData).toHaveBeenCalled();
    const callArg = mockLineWidget.setData.mock.calls[0]?.[0] as GraphSeries[];
    expect(callArg[0]?.x.length).toBe(50);
    expect(callArg[0]?.y.length).toBe(50);
  });
});
