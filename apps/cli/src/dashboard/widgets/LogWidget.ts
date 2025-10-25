import contrib from 'blessed-contrib';

import type blessed from 'blessed';

import type { WidgetConfig, WidgetUpdateData } from '../DashboardManager';

export interface LogWidgetData {
  message: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
  timestamp?: Date;
}

export class LogWidget {
  private widget: blessed.Widgets.BoxElement;
  private maxLines = 1000;

  constructor(config: WidgetConfig, grid: contrib.grid) {
    const { x, y, width, height } = config.position;

    this.widget = grid.set(y, x, height, width, contrib.log, {
      label: config.title,
      fg: 'green',
      selectedFg: 'green',
      bufferLength: this.maxLines,
    }) as blessed.Widgets.BoxElement;
  }

  update(data: WidgetUpdateData): void {
    if (data.message) {
      const formattedMessage = this.formatLogMessage(data.message);
      (this.widget as unknown as { log: (message: string) => void }).log(formattedMessage);
    }
  }

  private formatLogMessage(message: string): string {
    const timestamp = new Date().toLocaleTimeString();

    // Add color coding based on log level
    if (message.includes('ERROR:')) {
      return `{red-fg}[${timestamp}] ${message}{/red-fg}`;
    }
    if (message.includes('WARN:')) {
      return `{yellow-fg}[${timestamp}] ${message}{/yellow-fg}`;
    }
    if (message.includes('DEBUG:')) {
      return `{gray-fg}[${timestamp}] ${message}{/gray-fg}`;
    }

    return `{green-fg}[${timestamp}] ${message}{/green-fg}`;
  }

  clear(): void {
    // Clear the log widget
    (this.widget as unknown as { setContent: (content: string) => void }).setContent('');
  }

  getWidget(): blessed.Widgets.BoxElement {
    return this.widget;
  }
}
