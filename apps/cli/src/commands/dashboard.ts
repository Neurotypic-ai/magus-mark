import { DashboardManager } from '../dashboard/DashboardManager.js';
import { MetricsEngine } from '../dashboard/MetricsEngine.js';

import type { CommandModule } from 'yargs';

import type { DashboardConfig } from '../dashboard/DashboardManager.js';

interface DashboardOptions {
  layout: 'grid' | 'sidebar' | 'split' | 'custom';
  theme: 'matrix' | 'cyberpunk' | 'minimal' | 'hacker';
  refreshRate: number;
  config?: string;
  minimal: boolean;
  record?: string;
}

export const dashboardCommand: CommandModule<{}, DashboardOptions> = {
  command: 'dashboard',
  describe: '🔥 Launch the Matrix-style real-time God Tier dashboard',

  builder: (yargs) => {
    return yargs
      .option('layout', {
        describe: 'Dashboard layout style',
        choices: ['grid', 'sidebar', 'split', 'custom'] as const,
        default: 'grid',
      })
      .option('theme', {
        describe: 'Visual theme for maximum badassery',
        choices: ['matrix', 'cyberpunk', 'minimal', 'hacker'] as const,
        default: 'matrix',
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
      .example('$0 dashboard', 'Launch Matrix dashboard with default settings')
      .example('$0 dashboard --theme=cyberpunk --layout=sidebar', 'Cyberpunk themed sidebar layout')
      .example('$0 dashboard --minimal --refresh-rate=5000', 'Minimal dashboard for servers')
      .example('$0 dashboard --theme=hacker --record=session.replay', 'Hacker theme with session recording');
  },

  handler: async (argv) => {
    console.log('🚀 Initializing God Tier Dashboard...');
    console.log(`🎨 Theme: ${argv.theme.toUpperCase()}`);
    console.log(`📊 Layout: ${argv.layout}`);

    try {
      const config: DashboardConfig = await loadDashboardConfig(argv);
      const metricsEngine = new MetricsEngine();
      const dashboard = new DashboardManager(config);

      // Set up metrics collection
      setupMetricsCollection(dashboard, metricsEngine);

      // Start the badass dashboard
      console.log('🔥 Launching the most badass CLI dashboard ever created...');
      await dashboard.startDashboard();

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

async function loadDashboardConfig(argv: DashboardOptions): Promise<DashboardConfig> {
  // Load from file if specified, otherwise use badass defaults
  if (argv.config) {
    try {
      const fs = await import('fs/promises');
      const configData = await fs.readFile(argv.config, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn(`⚠️  Failed to load config file ${argv.config}, using defaults`);
    }
  }

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
  metrics.on('processing:progress', (data) => {
    dashboard.updateWidget('processing-status', { percent: data.value });
  });

  metrics.on('cost:updated', (data) => {
    dashboard.updateWidget('cost-tracker', { value: data.value.toFixed(4) });
  });

  metrics.on('tokens:usage', (data) => {
    const history = metrics.getHistoricalData('tokens:usage');
    const series = formatGraphData(history, 'Tokens/min');
    dashboard.updateWidget('token-usage', { series });
  });

  metrics.on('api:latency', (data) => {
    const history = metrics.getHistoricalData('api:latency');
    const series = formatGraphData(history, 'Latency (ms)');
    dashboard.updateWidget('api-latency', { series });
  });

  metrics.on('system:memory', (data) => {
    dashboard.updateWidget('system-memory', {
      data: [
        { label: 'Used', percent: data.value, color: 'green' },
        { label: 'Free', percent: 100 - data.value, color: 'blue' },
      ],
    });
  });

  metrics.on('system:log', (data) => {
    const level = data.tags?.level || 'info';
    const message = data.tags?.message || `Log entry ${data.value}`;
    const timestamp = new Date(data.timestamp).toLocaleTimeString();

    dashboard.updateWidget('system-log', {
      message: `[${timestamp}] ${level.toUpperCase()}: ${message}`,
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

  dashboard.on('theme:changed', (newTheme) => {
    metrics.recordMetric('system:log', {
      timestamp: Date.now(),
      value: 1,
      tags: { level: 'info', message: `🎨 Theme changed to ${newTheme.toUpperCase()}` },
    });
  });

  dashboard.on('widget:updated', (widgetId) => {
    // Track widget update frequency for performance monitoring
  });

  // Simulate some sample data for demonstration
  simulateSampleData(metrics);
}

function formatGraphData(history: any[], label: string): any {
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
  // Simulate processing progress
  let progress = 0;
  setInterval(() => {
    progress = Math.min(100, progress + Math.random() * 5);
    if (progress >= 100) progress = 0;

    const collector = (metrics as any).collectors.get('processing:progress');
    if (collector) {
      collector.updateProgress(progress);
    }
  }, 2000);

  // Simulate cost accumulation
  let totalCost = 0;
  setInterval(() => {
    totalCost += Math.random() * 0.001; // Small incremental cost

    const collector = (metrics as any).collectors.get('cost:updated');
    if (collector) {
      collector.addCost(Math.random() * 0.001);
    }
  }, 3000);

  // Simulate token usage
  setInterval(() => {
    const tokens = Math.floor(Math.random() * 1000) + 100;

    const collector = (metrics as any).collectors.get('tokens:usage');
    if (collector) {
      collector.recordTokens(tokens);
    }
  }, 4000);

  // Simulate API latency
  setInterval(() => {
    const latency = Math.random() * 2000 + 100; // 100-2100ms

    const collector = (metrics as any).collectors.get('api:latency');
    if (collector) {
      collector.recordLatency(latency);
    }
  }, 2500);

  // Simulate log messages
  const logMessages = [
    'Processing conversation batch',
    'API request completed successfully',
    'Token limit warning threshold reached',
    'Cache hit ratio: 87%',
    'Plugin loaded: enhanced-tagger',
    'Configuration updated',
    'Processing queue: 15 items remaining',
    'Model switched to gpt-4o for high-priority task',
  ];

  setInterval(() => {
    const message = logMessages[Math.floor(Math.random() * logMessages.length)];
    const levels = ['info', 'warn', 'debug', 'error'];
    const level = levels[Math.floor(Math.random() * levels.length)];

    const collector = (metrics as any).collectors.get('system:log');
    if (collector) {
      collector.recordLog(level, message);
    }
  }, 1500);
}
