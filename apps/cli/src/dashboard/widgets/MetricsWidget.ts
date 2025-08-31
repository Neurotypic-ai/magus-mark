import contrib from 'blessed-contrib';

import type blessed from 'blessed';

import type { WidgetConfig, WidgetUpdateData } from '../DashboardManager';

export interface MetricsWidgetData {
  value: number;
  label?: string;
  format?: 'number' | 'currency' | 'percentage';
}

export class MetricsWidget {
  private widget: blessed.Widgets.LcdElement;
  private config: WidgetConfig;

  constructor(config: WidgetConfig, grid: contrib.grid) {
    this.config = config;
    const { x, y, width, height } = config.position;

    this.widget = grid.set(y, x, height, width, contrib.lcd, {
      label: config.title,
      segmentWidth: 0.06,
      segmentInterval: 0.11,
      strokeWidth: 0.11,
      elements: 5,
      display: 32000,
      elementSpacing: 4,
      elementPadding: 2,
    }) as blessed.Widgets.LcdElement;
  }

  update(data: WidgetUpdateData): void {
    if (data.value !== undefined) {
      const displayValue = this.formatValue(data.value);
      (this.widget as unknown as { setDisplay: (value: string | number) => void }).setDisplay(displayValue);
    }
  }

  private formatValue(value: number): string | number {
    // Format based on widget configuration or data type
    if (this.config.dataSource.includes('cost')) {
      return `$${value.toFixed(4)}`;
    }
    if (this.config.dataSource.includes('percent')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value;
  }

  getWidget(): blessed.Widgets.LcdElement {
    return this.widget;
  }
}
