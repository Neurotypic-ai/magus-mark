import contrib from 'blessed-contrib';

import type blessed from 'blessed';

import type { WidgetConfig, WidgetUpdateData } from '../DashboardManager';

export interface GraphSeries {
  title: string;
  x: number[];
  y: number[];
  style: { line: string };
}

export interface GraphWidgetData {
  series: GraphSeries[];
  maxY?: number;
  minY?: number;
}

export class GraphWidget {
  private widget: blessed.Widgets.LineElement;
  private config: WidgetConfig;
  private maxDataPoints = 50;

  constructor(config: WidgetConfig, grid: contrib.grid) {
    this.config = config;
    const { x, y, width, height } = config.position;

    this.widget = grid.set(y, x, height, width, contrib.line, {
      label: config.title,
      showNthLabel: 5,
      maxY: 100,
      legend: { width: 12 },
      wholeNumbersOnly: false,
      style: {
        line: 'yellow',
        text: 'green',
        baseline: 'black',
      },
    }) as blessed.Widgets.LineElement;
  }

  update(data: WidgetUpdateData): void {
    if (data.series) {
      const series = data.series as GraphSeries[];
      const processedSeries = this.processSeriesData(series);
      (this.widget as unknown as { setData: (series: GraphSeries[]) => void }).setData(processedSeries);
    }
  }

  private processSeriesData(series: GraphSeries[]): GraphSeries[] {
    return series.map((s) => ({
      ...s,
      x: s.x.slice(-this.maxDataPoints),
      y: s.y.slice(-this.maxDataPoints),
    }));
  }

  addDataPoint(seriesTitle: string, x: number, y: number): void {
    // This would add a single data point to an existing series
    // Implementation depends on how the underlying widget handles data updates
  }

  getWidget(): blessed.Widgets.LineElement {
    return this.widget;
  }
}
