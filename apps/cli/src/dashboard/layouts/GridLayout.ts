import contrib from 'blessed-contrib';
import type blessed from 'blessed';

import type { WidgetConfig } from '../DashboardManager';

export interface LayoutPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutConfig {
  rows: number;
  cols: number;
  widgets: WidgetConfig[];
}

export class GridLayout {
  private grid: contrib.grid;
  private config: LayoutConfig;

  constructor(screen: blessed.Widgets.Screen, config: LayoutConfig) {
    this.config = config;
    this.grid = new contrib.grid({
      rows: config.rows,
      cols: config.cols,
      screen,
    });
  }

  getGrid(): contrib.grid {
    return this.grid;
  }

  validateLayout(): boolean {
    // Check if all widgets fit within the grid
    for (const widget of this.config.widgets) {
      const { x, y, width, height } = widget.position;

      if (x + width > this.config.cols || y + height > this.config.rows) {
        return false;
      }

      if (x < 0 || y < 0 || width <= 0 || height <= 0) {
        return false;
      }
    }

    return true;
  }

  optimizeLayout(): LayoutConfig {
    // Auto-optimize layout for better space utilization
    const optimized = { ...this.config };

    // Sort widgets by priority (larger widgets first)
    optimized.widgets.sort((a, b) => {
      const aArea = a.position.width * a.position.height;
      const bArea = b.position.width * b.position.height;
      return bArea - aArea;
    });

    // Reposition widgets to minimize gaps
    let currentRow = 0;
    let currentCol = 0;

    for (const widget of optimized.widgets) {
      const { width, height } = widget.position;

      // Check if widget fits in current row
      if (currentCol + width > this.config.cols) {
        currentRow += 1;
        currentCol = 0;
      }

      // Update widget position
      widget.position.x = currentCol;
      widget.position.y = currentRow;

      currentCol += width;
    }

    return optimized;
  }

  getWidgetPositions(): Record<string, LayoutPosition> {
    const positions: Record<string, LayoutPosition> = {};

    for (const widget of this.config.widgets) {
      positions[widget.id] = { ...widget.position };
    }

    return positions;
  }
}
