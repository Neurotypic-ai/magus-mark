import { describe, expect, it, vi } from 'vitest';

import { ProgressWidget } from './ProgressWidget';

import type { WidgetConfig } from '../DashboardManager';

const mockGaugeWidget = {
  setPercent: vi.fn(),
};

const mockGrid = {
  set: vi.fn(() => mockGaugeWidget),
};

vi.mock('blessed-contrib', () => ({
  default: {
    gauge: Symbol('gauge'),
  },
}));

describe('ProgressWidget', () => {
  it('updates percent value', () => {
    const config: WidgetConfig = {
      id: 'progress',
      type: 'progress',
      position: { x: 0, y: 0, width: 4, height: 2 },
      title: 'Progress',
      dataSource: 'processing:progress',
    };

    const widget = new ProgressWidget(config, mockGrid as never);
    widget.update({ percent: 75 });
    expect(mockGaugeWidget.setPercent).toHaveBeenCalledWith(75);
  });
});
