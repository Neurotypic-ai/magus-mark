import { describe, expect, it, vi } from 'vitest';

import { MetricsWidget } from './MetricsWidget';

import type { WidgetConfig } from '../DashboardManager';

const mockLcdWidget = {
  setDisplay: vi.fn(),
};

const mockGrid = {
  set: vi.fn(() => mockLcdWidget),
};

vi.mock('blessed-contrib', () => ({
  default: {
    lcd: Symbol('lcd'),
  },
}));

describe('MetricsWidget', () => {
  it('formats value based on dataSource hints', () => {
    const costConfig: WidgetConfig = {
      id: 'cost',
      type: 'metrics',
      position: { x: 0, y: 0, width: 4, height: 2 },
      title: 'Cost',
      dataSource: 'cost:updated',
    };

    const costWidget = new MetricsWidget(costConfig, mockGrid as never);
    costWidget.update({ value: 0.0123 });
    expect(mockLcdWidget.setDisplay).toHaveBeenCalledWith('$0.0123');

    const percentConfig: WidgetConfig = {
      id: 'percent',
      type: 'metrics',
      position: { x: 0, y: 0, width: 4, height: 2 },
      title: 'Percent',
      dataSource: 'percent:metric',
    };

    const percentWidget = new MetricsWidget(percentConfig, mockGrid as never);
    percentWidget.update({ value: 0.85 });
    expect(mockLcdWidget.setDisplay).toHaveBeenCalledWith('85.0%');
  });
});
