import { EventEmitter } from 'events';

import blessed from 'blessed';
import contrib from 'blessed-contrib';

export interface DashboardConfig {
  layout: 'grid' | 'sidebar' | 'split' | 'custom';
  widgets: WidgetConfig[];
  refreshRate: number;
  theme: 'matrix' | 'cyberpunk' | 'minimal' | 'hacker';
}

export interface WidgetConfig {
  id: string;
  type: 'metrics' | 'graph' | 'log' | 'progress' | 'chart';
  position: { x: number; y: number; width: number; height: number };
  title: string;
  dataSource: string;
}

export interface ThemeConfig {
  bg: string;
  fg: string;
  border: { fg: string };
  focus: { border: { fg: string } };
}

export interface WidgetUpdateData {
  value?: number;
  percent?: number;
  message?: string;
  series?: unknown;
  data?: { label: string; percent: number; color: string }[];
}

export class DashboardManager extends EventEmitter {
  private screen!: blessed.Widgets.Screen;
  private grid!: contrib.grid;
  private widgets: Map<string, blessed.Widgets.Node>;
  private config: DashboardConfig;
  private refreshInterval?: NodeJS.Timeout;

  constructor(config: DashboardConfig) {
    super();
    this.config = config;
    this.widgets = new Map();
    this.initializeScreen();
    this.createGrid();
  }

  private initializeScreen(): void {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Magus Mark - God Tier CLI Dashboard',
      cursor: {
        artificial: true,
        shape: 'line',
        blink: true,
        color: 'red',
      },
    });

    // Apply theme
    this.applyTheme(this.config.theme);

    // Handle exit
    this.screen.key(['escape', 'q', 'C-c'], () => {
      this.cleanup();
      process.exit(0);
    });

    // Handle theme switching
    this.screen.key(['t'], () => {
      this.cycleTheme();
    });

    // Handle help
    this.screen.key(['h', '?'], () => {
      this.showHelp();
    });
  }

  private createGrid(): void {
    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen,
    });
  }

  startDashboard(): void {
    this.createWidgets();
    this.startRefreshLoop();
    this.showWelcomeMessage();
    this.screen.render();

    // Emit started event
    this.emit('dashboard:started');
  }

  private createWidgets(): void {
    this.config.widgets.forEach((widgetConfig) => {
      const widget = this.createWidget(widgetConfig);
      this.widgets.set(widgetConfig.id, widget);
    });
  }

  private createWidget(config: WidgetConfig): blessed.Widgets.Node {
    const { x, y, width, height } = config.position;

    switch (config.type) {
      case 'metrics':
        return this.grid.set(y, x, height, width, contrib.lcd, {
          label: config.title,
          segmentWidth: 0.06,
          segmentInterval: 0.11,
          strokeWidth: 0.11,
          elements: 5,
          display: 32000,
          elementSpacing: 4,
          elementPadding: 2,
        }) as blessed.Widgets.Node;

      case 'graph':
        return this.grid.set(y, x, height, width, contrib.line, {
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
        }) as blessed.Widgets.Node;

      case 'progress':
        return this.grid.set(y, x, height, width, contrib.gauge, {
          label: config.title,
          stroke: 'green',
          fill: 'white',
        }) as blessed.Widgets.Node;

      case 'log':
        return this.grid.set(y, x, height, width, contrib.log, {
          label: config.title,
          fg: 'green',
          selectedFg: 'green',
        }) as blessed.Widgets.Node;

      case 'chart':
        return this.grid.set(y, x, height, width, contrib.donut, {
          label: config.title,
          radius: 8,
          arcWidth: 3,
          remainColor: 'black',
          yPadding: 2,
        }) as blessed.Widgets.Node;

      default:
        throw new Error(`Unknown widget type: ${config.type as string}`);
    }
  }

  private applyTheme(theme: string): void {
    const themes: Record<string, ThemeConfig> = {
      matrix: {
        bg: 'black',
        fg: 'green',
        border: { fg: 'green' },
        focus: { border: { fg: 'cyan' } },
      },
      cyberpunk: {
        bg: 'black',
        fg: 'magenta',
        border: { fg: 'magenta' },
        focus: { border: { fg: 'yellow' } },
      },
      minimal: {
        bg: 'black',
        fg: 'white',
        border: { fg: 'gray' },
        focus: { border: { fg: 'blue' } },
      },
      hacker: {
        bg: 'black',
        fg: 'cyan',
        border: { fg: 'cyan' },
        focus: { border: { fg: 'red' } },
      },
    };

    const selectedTheme = themes[theme] ?? themes['matrix'];

    // Apply theme to screen - Note: blessed screen may not have direct style property
    // This is a placeholder for theme application
    console.log(`Applied theme: ${theme}`, selectedTheme);
  }

  private startRefreshLoop(): void {
    this.refreshInterval = setInterval(() => {
      this.refreshAllWidgets();
      this.screen.render();
    }, this.config.refreshRate);
  }

  private refreshAllWidgets(): void {
    this.widgets.forEach((widget, id) => {
      this.emit('widget:refresh', id, widget);
    });
  }

  updateWidget(id: string, data: WidgetUpdateData): void {
    const widget = this.widgets.get(id);
    if (!widget) return;

    // Update widget with new data based on type
    const widgetConfig = this.config.widgets.find((w) => w.id === id);
    if (!widgetConfig) return;

    switch (widgetConfig.type) {
      case 'metrics':
        if (data.value !== undefined) {
          (widget as unknown as { setDisplay: (value: number) => void }).setDisplay(data.value ?? 0);
        }
        break;

      case 'graph':
        if (data.series) {
          (widget as unknown as { setData: (series: unknown) => void }).setData(data.series);
        }
        break;

      case 'progress':
        if (data.percent !== undefined) {
          (widget as unknown as { setPercent: (percent: number) => void }).setPercent(data.percent);
        }
        break;

      case 'log':
        if (data.message) {
          (widget as unknown as { log: (message: string) => void }).log(data.message);
        }
        break;

      case 'chart':
        if (data.data) {
          (widget as unknown as { setData: (chartData: unknown) => void }).setData(data.data);
        }
        break;
    }

    // Emit updated event
    this.emit('widget:updated', id, data);
  }

  private cycleTheme(): void {
    const themes = ['matrix', 'cyberpunk', 'minimal', 'hacker'] as const;
    const currentIndex = themes.indexOf(this.config.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.config.theme = themes[nextIndex];
    this.applyTheme(this.config.theme);
    this.screen.render();
    this.emit('theme:changed', this.config.theme);
  }

  private showWelcomeMessage(): void {
    const box = blessed.message({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 'shrink',
      height: 'shrink',
      tags: true,
      border: {
        type: 'line',
      },
      style: {
        fg: 'white',
        bg: 'blue',
        border: {
          fg: '#f0f0f0',
        },
      },
    });

    box.display(
      '{center}🔥 {bold}MAGUS MARK GOD TIER DASHBOARD{/bold} 🔥{/center}\n\n' +
        '{center}Matrix-style real-time monitoring activated!{/center}\n\n' +
        '{center}Press [t] to cycle themes, [h] for help, [q] to quit{/center}',
      2,
      () => {
        this.screen.render();
      }
    );
  }

  private showHelp(): void {
    const helpText = `
{center}{bold}🚀 GOD TIER DASHBOARD CONTROLS 🚀{/bold}{/center}

{bold}Navigation:{/bold}
  [t]           Cycle themes (Matrix, Cyberpunk, Minimal, Hacker)
  [h] or [?]    Show this help
  [q] or [Esc]  Exit dashboard
  [Ctrl+C]      Force quit

{bold}Themes:{/bold}
  Matrix        Classic green-on-black hacker aesthetic
  Cyberpunk     Magenta and yellow futuristic vibes
  Minimal       Clean white-on-black professional look
  Hacker        Cyan terminal with red highlights

{bold}Features:{/bold}
  Real-time metrics     Live processing stats
  Cost tracking         Budget monitoring
  Token usage graphs    API consumption
  System logs           Detailed activity
  Performance charts    System health

{center}Press any key to continue...{/center}
    `;

    const box = blessed.message({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: '80%',
      height: '80%',
      tags: true,
      border: {
        type: 'line',
      },
      style: {
        fg: 'white',
        bg: 'black',
        border: {
          fg: '#f0f0f0',
        },
      },
    });

    box.display(helpText, 0, () => {
      this.screen.render();
    });
  }

  getWidgetById(id: string): blessed.Widgets.Node | undefined {
    return this.widgets.get(id);
  }

  getStats(): DashboardStats {
    return {
      widgetCount: this.widgets.size,
      theme: this.config.theme,
      refreshRate: this.config.refreshRate,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  cleanup(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.emit('dashboard:cleanup');
  }
}

export interface DashboardStats {
  widgetCount: number;
  theme: string;
  refreshRate: number;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
}
