import { DashboardManager } from '../dashboard/DashboardManager.js';
import { MetricsEngine } from '../dashboard/MetricsEngine.js';

import type { CommandModule } from 'yargs';

import type { DashboardConfig } from '../dashboard/DashboardManager.js';
import type { MetricData } from '../dashboard/MetricsEngine.js';

interface DashboardOptions {
  layout: 'grid' | 'sidebar' | 'split' | 'custom';
  theme: 'matrix' | 'cyberpunk' | 'minimal' | 'hacker';
  refreshRate: number;
  config: string | undefined;
  minimal: boolean;
  record: string | undefined;
}

function isDashboardLayout(value: unknown): value is DashboardOptions['layout'] {
  return value === 'grid' || value === 'sidebar' || value === 'split' || value === 'custom';
}

function isDashboardTheme(value: unknown): value is DashboardOptions['theme'] {
  return value === 'matrix' || value === 'cyberpunk' || value === 'minimal' || value === 'hacker';
}

function normalizeOptions(raw: unknown): DashboardOptions {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const layout = isDashboardLayout(obj['layout']) ? obj['layout'] : 'grid';
  const theme = isDashboardTheme(obj['theme']) ? obj['theme'] : 'matrix';
  const refreshRateSource = obj['refreshRate'] ?? obj['refresh-rate'];
  const refreshRate =
    typeof refreshRateSource === 'number' && Number.isFinite(refreshRateSource) ? refreshRateSource : 1000;
  const config = typeof obj['config'] === 'string' ? obj['config'] : undefined;
  const minimal = typeof obj['minimal'] === 'boolean' ? obj['minimal'] : false;
  const record = typeof obj['record'] === 'string' ? obj['record'] : undefined;
  return { layout, theme, refreshRate, config, minimal, record };
}

export const dashboardStandaloneCommand: CommandModule = {
  command: 'dashboard-demo',
  describe: '🔥 Launch the Matrix-style real-time God Tier dashboard (standalone demo)',

  builder: (yargs) => {
    return yargs
      .option('layout', {
        describe: 'Dashboard layout style',
        choices: ['grid', 'sidebar', 'split', 'custom'] as const,
        default: 'grid' as const,
      })
      .option('theme', {
        describe: 'Visual theme for maximum badassery',
        choices: ['matrix', 'cyberpunk', 'minimal', 'hacker'] as const,
        default: 'matrix' as const,
      })
      .option('refresh-rate', {
        describe: 'Refresh rate in milliseconds',
        type: 'number',
        default: 1000,
      })
      .option('config', {
        describe: 'Path to dashboard configuration file',
        type: 'string',
      })
      .option('minimal', {
        describe: 'Minimal dashboard for headless environments',
        type: 'boolean',
        default: false,
      })
      .option('record', {
        describe: 'Record session for replay',
        type: 'string',
      })
      .example('$0 dashboard-demo', 'Launch Matrix dashboard with default settings')
      .example('$0 dashboard-demo --theme=cyberpunk --layout=sidebar', 'Cyberpunk themed sidebar layout')
      .example('$0 dashboard-demo --minimal --refresh-rate=5000', 'Minimal dashboard for servers')
      .example('$0 dashboard-demo --theme=hacker --record=session.replay', 'Hacker theme with session recording');
  },

  handler: (argv) => {
    const options = normalizeOptions(argv);
    console.log('🚀 Initializing God Tier Dashboard Demo...');
    console.log(`🎨 Theme: ${options.theme.toUpperCase()}`);
    console.log(`📊 Layout: ${options.layout}`);
    console.log('🔥 THIS IS THE MOST BADASS CLI DASHBOARD EVER CREATED!');

    try {
      const config: DashboardConfig = loadDashboardConfig(options);
      const metricsEngine = new MetricsEngine();
      const dashboard = new DashboardManager(config);

      // Set up metrics collection
      setupMetricsCollection(dashboard, metricsEngine);

      // Start the badass dashboard
      console.log('⚡ LAUNCHING GOD TIER MATRIX DASHBOARD...');
      dashboard.startDashboard();

      // Set up graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Gracefully shutting down God Tier Dashboard...');
        dashboard.cleanup();
        metricsEngine.cleanup();
        process.exit(0);
      });

      // Keep process alive and responsive
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
    } catch (error) {
      console.error('💥 Failed to launch dashboard:', error);
      process.exit(1);
    }
  },
};

function loadDashboardConfig(argv: DashboardOptions): DashboardConfig {
  // God Tier default configuration
  return {
    layout: argv.layout,
    refreshRate: argv.refreshRate,
    theme: argv.theme,
    widgets: [
      {
        id: 'processing-status',
        type: 'progress',
        position: { x: 0, y: 0, width: 4, height: 2 },
        title: '⚡ Processing Status',
        dataSource: 'processing:progress',
      },
      {
        id: 'cost-tracker',
        type: 'metrics',
        position: { x: 4, y: 0, width: 4, height: 2 },
        title: '💰 Cost Tracker',
        dataSource: 'cost:updated',
      },
      {
        id: 'token-usage',
        type: 'graph',
        position: { x: 8, y: 0, width: 4, height: 4 },
        title: '🎯 Token Usage',
        dataSource: 'tokens:usage',
      },
      {
        id: 'api-latency',
        type: 'graph',
        position: { x: 0, y: 2, width: 8, height: 4 },
        title: '🚀 API Response Times',
        dataSource: 'api:latency',
      },
      {
        id: 'system-memory',
        type: 'chart',
        position: { x: 8, y: 4, width: 4, height: 4 },
        title: '🧠 Memory Usage',
        dataSource: 'system:memory',
      },
      {
        id: 'system-log',
        type: 'log',
        position: { x: 0, y: 6, width: 12, height: 6 },
        title: '📋 System Log',
        dataSource: 'system:log',
      },
    ],
  };
}

function setupMetricsCollection(dashboard: DashboardManager, metrics: MetricsEngine): void {
  // Start collecting all metrics
  metrics.startCollection('processing:progress', 1000);
  metrics.startCollection('cost:updated', 2000);
  metrics.startCollection('tokens:usage', 1500);
  metrics.startCollection('api:latency', 1000);
  metrics.startCollection('system:memory', 3000);
  metrics.startCollection('system:cpu', 2000);

  // Set up real-time data feeds to dashboard widgets
  interface MetricData {
    value: number;
    timestamp: number;
    tags?: Record<string, string | number>;
  }

  metrics.on('processing:progress', (data: MetricData) => {
    dashboard.updateWidget('processing-status', { percent: data.value });
  });

  metrics.on('cost:updated', (data: MetricData) => {
    dashboard.updateWidget('cost-tracker', { value: data.value });
  });

  metrics.on('tokens:usage', () => {
    const history = metrics.getHistoricalData('tokens:usage');
    const series = formatGraphData(history, 'Tokens/min');
    dashboard.updateWidget('token-usage', { series });
  });

  metrics.on('api:latency', () => {
    const history = metrics.getHistoricalData('api:latency');
    const series = formatGraphData(history, 'Latency (ms)');
    dashboard.updateWidget('api-latency', { series });
  });

  metrics.on('system:memory', (data: MetricData) => {
    dashboard.updateWidget('system-memory', {
      data: [
        { label: 'Used', percent: data.value, color: 'green' },
        { label: 'Free', percent: 100 - data.value, color: 'blue' },
      ],
    });
  });

  metrics.on('system:log', (data: MetricData) => {
    const level = data.tags?.['level'] ?? 'info';
    const message = data.tags?.['message'] ?? `Log entry ${data.value.toString()}`;
    const timestamp = new Date(data.timestamp).toLocaleTimeString();

    dashboard.updateWidget('system-log', {
      message: `[${timestamp}] ${String(level).toUpperCase()}: ${String(message)}`,
    });
  });

  // Dashboard event handlers
  dashboard.on('dashboard:started', () => {
    metrics.recordMetric('system:log', {
      timestamp: Date.now(),
      value: 1,
      tags: { level: 'info', message: '🔥 God Tier Dashboard launched successfully!' },
    });
  });

  dashboard.on('theme:changed', (newTheme: string) => {
    metrics.recordMetric('system:log', {
      timestamp: Date.now(),
      value: 1,
      tags: { level: 'info', message: `🎨 Theme changed to ${newTheme.toUpperCase()}` },
    });
  });

  dashboard.on('widget:updated', () => {
    // Track widget update frequency for performance monitoring
    // Implementation placeholder for future metrics tracking
  });

  // Simulate some sample data for demonstration
  simulateSampleData(metrics);
}

interface HistoryPoint {
  value: number;
  timestamp: number;
}

interface GraphSeries {
  title: string;
  x: number[];
  y: number[];
  style: { line: string };
}

function formatGraphData(history: HistoryPoint[], label: string): GraphSeries[] {
  const data = history.slice(-50).map((point, index) => ({
    x: index,
    y: point.value,
  }));

  return [
    {
      title: label,
      x: data.map((p) => p.x),
      y: data.map((p) => p.y),
      style: { line: 'red' },
    },
  ];
}

function simulateSampleData(metrics: MetricsEngine): void {
  // Create a simple type-safe metrics recorder
  interface SafeMetricsRecorder {
    recordMetric: (type: string, data: MetricData) => void;
  }

  const safeMetrics: SafeMetricsRecorder = {
    recordMetric: (type: string, data: MetricData) => {
      metrics.recordMetric(type, data);
    },
  };

  // Simulate processing progress
  let progress = 0;
  setInterval(() => {
    progress = Math.min(100, progress + Math.random() * 5);
    if (progress >= 100) progress = 0;

    safeMetrics.recordMetric('processing:progress', {
      value: progress,
      timestamp: Date.now(),
    });
  }, 2000);

  // Simulate cost accumulation
  setInterval(() => {
    const costIncrement = Math.random() * 0.001;

    safeMetrics.recordMetric('cost:updated', {
      value: costIncrement,
      timestamp: Date.now(),
    });
  }, 3000);

  // Simulate token usage
  setInterval(() => {
    const tokens = Math.floor(Math.random() * 1000) + 100;

    safeMetrics.recordMetric('tokens:usage', {
      value: tokens,
      timestamp: Date.now(),
    });
  }, 4000);

  // Simulate API latency
  setInterval(() => {
    const latency = Math.random() * 2000 + 100; // 100-2100ms

    safeMetrics.recordMetric('api:latency', {
      value: latency,
      timestamp: Date.now(),
    });
  }, 2500);

  // Simulate log messages
  const logMessages = [
    '🚀 Processing conversation batch',
    '✅ API request completed successfully',
    '⚠️  Token limit warning threshold reached',
    '📊 Cache hit ratio: 87%',
    '🔌 Plugin loaded: enhanced-tagger',
    '⚙️  Configuration updated',
    '📋 Processing queue: 15 items remaining',
    '🧠 Model switched to gpt-4o for high-priority task',
    '🔥 God Tier performance detected',
    '💎 Maximum badassery achieved',
  ];

  setInterval(() => {
    const message = logMessages[Math.floor(Math.random() * logMessages.length)];
    const levels = ['info', 'warn', 'debug', 'error'];
    const level = levels[Math.floor(Math.random() * levels.length)];

    if (message && level) {
      safeMetrics.recordMetric('system:log', {
        value: 1,
        timestamp: Date.now(),
        tags: { level, message },
      });
    }
  }, 1500);
}
