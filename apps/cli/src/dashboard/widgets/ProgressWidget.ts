import contrib from 'blessed-contrib';

import type blessed from 'blessed';

import type { WidgetConfig, WidgetUpdateData } from '../DashboardManager';

export interface ProgressWidgetData {
  percent: number;
  label?: string;
  color?: string;
}

export class ProgressWidget {
  private widget: blessed.Widgets.ProgressBarElement;

  constructor(config: WidgetConfig, grid: contrib.grid) {
    const { x, y, width, height } = config.position;

    this.widget = grid.set(y, x, height, width, contrib.gauge, {
      label: config.title,
      stroke: 'green',
      fill: 'white',
    }) as blessed.Widgets.ProgressBarElement;
  }

  update(data: WidgetUpdateData): void {
    if (data.percent !== undefined) {
      (this.widget as unknown as { setPercent: (percent: number) => void }).setPercent(data.percent);
    }
  }

  getWidget(): blessed.Widgets.ProgressBarElement {
    return this.widget;
  }
}
