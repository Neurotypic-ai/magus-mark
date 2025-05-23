# CLI Integration for VS Code Extension

## 🚀 Revolutionary Architecture: Direct CLI Integration

Instead of duplicating sophisticated business logic from the core package, the VS Code extension leverages the
**production-ready CLI** directly to access all its advanced capabilities without code duplication.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     VS Code Extension                          │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   UI Views      │  │   Commands      │  │   Providers     │  │
│  │   • Progress    │  │   • Tag Files   │  │   • Smart Tags  │  │
│  │   • Results     │  │   • Benchmark   │  │   • Analytics   │  │
│  │   • Analytics   │  │   • Analytics   │  │   • Cost Est.   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│           │                     │                     │         │
│           └─────────────────────┼─────────────────────┘         │
│                                 │                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              CLI Integration Service                    │    │
│  │  • Process Management    • Progress Streaming          │    │
│  │  • JSON Communication    • Error Handling              │    │
│  │  • Configuration Sync    • Feature Detection           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                 │                               │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Magus Mark CLI                               │
│                                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │    Cost     │ │Benchmarking │ │  Workflow   │ │   Testing   │ │
│ │ Management  │ │   System    │ │Orchestration│ │   System    │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │Configuration│ │ Statistics  │ │   Tagging   │ │  Progress   │ │
│ │  Profiles   │ │ Analytics   │ │   Engine    │ │ Reporting   │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Benefits of CLI Integration

| Benefit                   | Description                                                   | Implementation Status |
| ------------------------- | ------------------------------------------------------------- | --------------------- |
| **Zero Code Duplication** | Reuse all CLI functionality without reimplementation          | ✅ Ready              |
| **Advanced Features**     | Get cost management, benchmarking, optimization automatically | ✅ Ready              |
| **Consistent Behavior**   | Identical results across VS Code and command line             | ✅ Ready              |
| **Easy Maintenance**      | Single source of truth for business logic                     | ✅ Ready              |
| **Rich Capabilities**     | Access to workflow orchestration, testing, analytics          | ✅ Ready              |
| **Configuration Sync**    | Shared configuration profiles and settings                    | ✅ Ready              |

## Implementation Guide

### 1. CLI Integration Service

**File: `apps/vscode/src/services/CLIIntegrationService.ts`**

```typescript
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';

import * as vscode from 'vscode';

export interface CLIOptions {
  workspaceRoot: string;
  cliPath?: string;
  timeout?: number;
  enableStreaming?: boolean;
}

export interface ProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ProgressData {
  type: 'progress';
  current: number;
  total: number;
  message?: string;
  cost?: number;
  filesProcessed?: string[];
}

export class CLIIntegrationService extends EventEmitter {
  private cliPath: string;
  private workspaceRoot: string;
  private timeout: number;
  private enableStreaming: boolean;

  constructor(options: CLIOptions) {
    super();
    this.workspaceRoot = options.workspaceRoot;
    this.cliPath = options.cliPath || this.detectCLIPath();
    this.timeout = options.timeout || 300000; // 5 minutes default
    this.enableStreaming = options.enableStreaming ?? true;
  }

  /**
   * Tag files using the CLI with full cost management and progress tracking
   */
  async tagFiles(paths: string[], options: TaggingOptions): Promise<TaggingResult> {
    const cliArgs = this.buildTagCommand(paths, options);
    const result = await this.executeCLI(cliArgs);

    if (result.exitCode !== 0) {
      throw new Error(`Tagging failed: ${result.stderr}`);
    }

    return this.parseTaggingResult(result.stdout);
  }

  /**
   * Get accurate cost estimate using CLI's sophisticated cost calculator
   */
  async getCostEstimate(paths: string[], options?: Partial<TaggingOptions>): Promise<CostEstimate> {
    const cliArgs = [
      'tag',
      ...paths,
      '--dry-run',
      '--output-format=json',
      ...(options?.model ? [`--model=${options.model}`] : []),
      ...(options?.concurrency ? [`--concurrency=${options.concurrency}`] : []),
    ];

    const result = await this.executeCLI(cliArgs);

    if (result.exitCode !== 0) {
      throw new Error(`Cost estimation failed: ${result.stderr}`);
    }

    return JSON.parse(result.stdout);
  }

  /**
   * Run comprehensive benchmarking using CLI's advanced testing system
   */
  async runBenchmark(options: BenchmarkOptions): Promise<BenchmarkReport> {
    const cliArgs = this.buildBenchmarkCommand(options);
    const result = await this.executeCLI(cliArgs);

    if (result.exitCode !== 0) {
      throw new Error(`Benchmark failed: ${result.stderr}`);
    }

    return JSON.parse(result.stdout);
  }

  /**
   * Get comprehensive usage analytics
   */
  async getAnalytics(period: 'day' | 'week' | 'month' | 'all' = 'all'): Promise<AnalyticsData> {
    const [usageStats, costAnalytics, performanceMetrics] = await Promise.all([
      this.executeCLI(['stats', '--type=usage', '--period=' + period, '--format=json']),
      this.executeCLI(['stats', '--type=cost', '--period=' + period, '--format=json']),
      this.executeCLI(['stats', '--type=performance', '--period=' + period, '--format=json']),
    ]);

    return {
      usage: JSON.parse(usageStats.stdout),
      cost: JSON.parse(costAnalytics.stdout),
      performance: JSON.parse(performanceMetrics.stdout),
      period,
    };
  }

  /**
   * Execute CLI command with progress streaming and error handling
   */
  private async executeCLI(args: string[]): Promise<ProcessResult> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.cliPath, args, {
        cwd: this.workspaceRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          MAGUS_OUTPUT_FORMAT: 'json-stream', // Enable streaming output
        },
      });

      let stdout = '';
      let stderr = '';
      let timeoutHandle: NodeJS.Timeout | undefined;

      // Set timeout
      if (this.timeout > 0) {
        timeoutHandle = setTimeout(() => {
          process.kill('SIGTERM');
          reject(new Error(`CLI command timed out after ${this.timeout}ms`));
        }, this.timeout);
      }

      process.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;

        if (this.enableStreaming) {
          this.handleProgressUpdate(chunk);
        }
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
        });
      });

      process.on('error', (error) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        reject(error);
      });
    });
  }

  /**
   * Handle real-time progress updates from CLI
   */
  private handleProgressUpdate(data: string): void {
    const lines = data.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      try {
        const update = JSON.parse(line);

        if (update.type === 'progress') {
          this.emit('progress', {
            current: update.current,
            total: update.total,
            message: update.message,
            cost: update.cost,
            filesProcessed: update.filesProcessed,
          } as ProgressData);
        } else if (update.type === 'cost-warning') {
          this.emit('costWarning', update);
        } else if (update.type === 'error') {
          this.emit('error', new Error(update.message));
        }
      } catch {
        // Ignore non-JSON output (regular CLI messages)
      }
    }
  }

  /**
   * Build CLI command arguments for tagging
   */
  private buildTagCommand(paths: string[], options: TaggingOptions): string[] {
    const args = ['tag', ...paths, '--output-format=json'];

    if (options.model) args.push(`--model=${options.model}`);
    if (options.concurrency) args.push(`--concurrency=${options.concurrency}`);
    if (options.maxCost) args.push(`--max-cost=${options.maxCost}`);
    if (options.dryRun) args.push('--dry-run');
    if (options.force) args.push('--force');
    if (options.mode) args.push(`--mode=${options.mode}`);
    if (options.tagMode) args.push(`--tag-mode=${options.tagMode}`);
    if (options.minConfidence) args.push(`--min-confidence=${options.minConfidence}`);
    if (options.reviewThreshold) args.push(`--review-threshold=${options.reviewThreshold}`);
    if (options.onLimit) args.push(`--on-limit=${options.onLimit}`);

    return args;
  }

  /**
   * Build CLI command arguments for benchmarking
   */
  private buildBenchmarkCommand(options: BenchmarkOptions): string[] {
    const args = ['test', '--benchmark', '--format=json'];

    if (options.models?.length) {
      args.push(`--models=${options.models.join(',')}`);
    }
    if (options.samples) args.push(`--samples=${options.samples}`);
    if (options.testSet) args.push(`--test-set=${options.testSet}`);
    if (options.compare) args.push('--compare');
    if (options.saveReport) args.push('--save-report');
    if (options.reportPath) args.push(`--report=${options.reportPath}`);

    return args;
  }

  /**
   * Parse tagging result from CLI output
   */
  private parseTaggingResult(stdout: string): TaggingResult {
    try {
      return JSON.parse(stdout);
    } catch (error) {
      throw new Error(`Failed to parse CLI output: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Detect CLI path automatically
   */
  private detectCLIPath(): string {
    const config = vscode.workspace.getConfiguration('magusMarkk.cli');
    const configPath = config.get<string>('path');

    if (configPath) {
      return configPath;
    }

    // Try common installation paths
    const candidates = ['magus-mark', 'npx magus-mark', './node_modules/.bin/magus-mark'];

    // Return the first candidate (will be validated later)
    return candidates[0];
  }

  /**
   * Validate CLI availability and version
   */
  async validateCLI(): Promise<CLIValidation> {
    try {
      const result = await this.executeCLI(['--version']);

      if (result.exitCode === 0) {
        const version = result.stdout.trim();
        return {
          available: true,
          version,
          path: this.cliPath,
          features: await this.detectCLIFeatures(),
        };
      } else {
        return {
          available: false,
          error: result.stderr || 'Unknown error',
        };
      }
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Detect available CLI features
   */
  private async detectCLIFeatures(): Promise<string[]> {
    try {
      const result = await this.executeCLI(['--help']);
      const features: string[] = [];

      if (result.stdout.includes('--benchmark')) features.push('benchmarking');
      if (result.stdout.includes('--dry-run')) features.push('cost-estimation');
      if (result.stdout.includes('stats')) features.push('analytics');
      if (result.stdout.includes('config')) features.push('configuration');
      if (result.stdout.includes('test')) features.push('testing');

      return features;
    } catch {
      return [];
    }
  }
}

// Type definitions
export interface TaggingOptions {
  model?: string;
  concurrency?: number;
  maxCost?: number;
  dryRun?: boolean;
  force?: boolean;
  mode?: 'auto' | 'interactive' | 'differential';
  tagMode?: 'append' | 'replace' | 'merge';
  minConfidence?: number;
  reviewThreshold?: number;
  onLimit?: 'pause' | 'warn' | 'stop';
}

export interface TaggingResult {
  success: boolean;
  filesProcessed: number;
  filesTagged: number;
  totalCost: number;
  totalTokens: number;
  processingTime: number;
  files: Array<{
    path: string;
    status: 'success' | 'error' | 'skipped';
    tagsAdded: string[];
    error?: string;
  }>;
}

export interface CostEstimate {
  totalCost: number;
  totalTokens: number;
  filesCount: number;
  modelPricing: {
    model: string;
    inputCostPer1k: number;
    outputCostPer1k: number;
  };
  breakdown: Array<{
    file: string;
    estimatedTokens: number;
    estimatedCost: number;
  }>;
}

export interface BenchmarkOptions {
  models?: string[];
  samples?: number;
  testSet?: string;
  compare?: boolean;
  saveReport?: boolean;
  reportPath?: string;
}

export interface BenchmarkReport {
  timestamp: string;
  models: Array<{
    model: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    avgLatency: number;
    totalCost: number;
    totalTokens: number;
  }>;
  summary: {
    bestAccuracy: string;
    bestLatency: string;
    bestCostEfficiency: string;
    recommendation: string;
  };
}

export interface AnalyticsData {
  usage: {
    totalFiles: number;
    totalTags: number;
    averageTagsPerFile: number;
    mostUsedTags: Array<{ tag: string; count: number }>;
  };
  cost: {
    totalSpent: number;
    averageCostPerFile: number;
    costByModel: Record<string, number>;
    dailySpending: Array<{ date: string; cost: number }>;
  };
  performance: {
    averageProcessingTime: number;
    throughput: number;
    errorRate: number;
    successRate: number;
  };
  period: string;
}

export interface CLIValidation {
  available: boolean;
  version?: string;
  path?: string;
  features?: string[];
  error?: string;
}
```

### 2. Configuration Management

**VS Code Settings Integration:**

```json
{
  "magusMarkk.cli.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Enable CLI integration for advanced features"
  },
  "magusMarkk.cli.path": {
    "type": "string",
    "default": "magus-mark",
    "description": "Path to Magus Mark CLI executable"
  },
  "magusMarkk.cli.autoSync": {
    "type": "boolean",
    "default": true,
    "description": "Automatically sync VS Code settings with CLI profiles"
  },
  "magusMarkk.cli.timeout": {
    "type": "number",
    "default": 300000,
    "description": "CLI command timeout in milliseconds"
  },
  "magusMarkk.cli.useAdvancedFeatures": {
    "type": "boolean",
    "default": true,
    "description": "Enable advanced CLI features (benchmarking, analytics, optimization)"
  },
  "magusMarkk.cli.enableStreaming": {
    "type": "boolean",
    "default": true,
    "description": "Enable real-time progress streaming from CLI"
  }
}
```

**Configuration Synchronization Service:**

```typescript
export class ConfigurationSyncService {
  private cliService: CLIIntegrationService;

  constructor(cliService: CLIIntegrationService) {
    this.cliService = cliService;
  }

  /**
   * Sync VS Code settings to CLI profile
   */
  async syncToProfile(profileName = 'vscode-sync'): Promise<void> {
    const config = vscode.workspace.getConfiguration('magusMarkk');

    const profileData = {
      defaultModel: config.get('ai.defaultModel', 'gpt-4o'),
      concurrency: config.get('processing.concurrency', 3),
      costLimit: config.get('cost.maxBudget', 10.0),
      minConfidence: config.get('ai.minConfidence', 0.7),
      tagMode: config.get('tagging.mode', 'append'),
      outputFormat: 'json',
    };

    // Create or update CLI profile
    await this.cliService.executeCLI([
      'config',
      'create-profile',
      profileName,
      '--model',
      profileData.defaultModel,
      '--concurrency',
      profileData.concurrency.toString(),
      '--cost-limit',
      profileData.costLimit.toString(),
      '--min-confidence',
      profileData.minConfidence.toString(),
      '--tag-mode',
      profileData.tagMode,
    ]);

    // Activate the profile
    await this.cliService.executeCLI(['config', 'use-profile', profileName]);
  }

  /**
   * Import CLI settings to VS Code
   */
  async importFromCLI(): Promise<void> {
    const result = await this.cliService.executeCLI(['config', 'export', '--format=json']);
    const cliConfig = JSON.parse(result.stdout);

    const config = vscode.workspace.getConfiguration('magusMarkk');
    const updates: Array<Promise<void>> = [];

    if (cliConfig.defaultModel) {
      updates.push(config.update('ai.defaultModel', cliConfig.defaultModel, vscode.ConfigurationTarget.Workspace));
    }
    if (cliConfig.concurrency) {
      updates.push(
        config.update('processing.concurrency', cliConfig.concurrency, vscode.ConfigurationTarget.Workspace)
      );
    }
    if (cliConfig.costLimit) {
      updates.push(config.update('cost.maxBudget', cliConfig.costLimit, vscode.ConfigurationTarget.Workspace));
    }

    await Promise.all(updates);
  }
}
```

### 3. Advanced Features Integration

**Benchmarking Command:**

```typescript
export async function registerBenchmarkCommand(
  context: vscode.ExtensionContext,
  cliService: CLIIntegrationService
): Promise<void> {
  const command = vscode.commands.registerCommand('magusMarkk.cli.runBenchmark', async () => {
    const panel = vscode.window.createWebviewPanel('magusBenchmark', 'AI Model Benchmark', vscode.ViewColumn.One, {
      enableScripts: true,
    });

    // Setup webview HTML with progress indicators
    panel.webview.html = getBenchmarkWebviewHTML();

    try {
      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Running AI Model Benchmark',
          cancellable: true,
        },
        async (progress, token) => {
          // Setup progress listener
          cliService.on('progress', (data: ProgressData) => {
            const increment = (data.current / data.total) * 100;
            progress.report({
              increment,
              message: data.message || `Processing ${data.current}/${data.total}`,
            });

            // Update webview
            panel.webview.postMessage({
              type: 'progress',
              data,
            });
          });

          // Run benchmark
          const options: BenchmarkOptions = {
            models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o'],
            samples: 20,
            compare: true,
            saveReport: true,
          };

          const result = await cliService.runBenchmark(options);

          // Display results in webview
          panel.webview.postMessage({
            type: 'results',
            data: result,
          });

          return result;
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Benchmark failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  context.subscriptions.push(command);
}
```

**Cost Analysis Command:**

```typescript
export async function registerCostAnalysisCommand(
  context: vscode.ExtensionContext,
  cliService: CLIIntegrationService
): Promise<void> {
  const command = vscode.commands.registerCommand('magusMarkk.cli.analyzeCosts', async () => {
    try {
      const workspaceFiles = await vscode.workspace.findFiles('**/*.md', '**/node_modules/**');
      const filePaths = workspaceFiles.map((uri) => uri.fsPath);

      if (filePaths.length === 0) {
        vscode.window.showInformationMessage('No markdown files found in workspace');
        return;
      }

      const estimate = await cliService.getCostEstimate(filePaths);

      // Show cost breakdown
      const panel = vscode.window.createWebviewPanel('magusCostAnalysis', 'Cost Analysis', vscode.ViewColumn.One, {
        enableScripts: true,
      });

      panel.webview.html = getCostAnalysisWebviewHTML(estimate);

      // Add action buttons
      panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === 'proceedWithProcessing') {
          const proceed = await vscode.window.showWarningMessage(
            `This will cost approximately $${estimate.totalCost.toFixed(4)}. Continue?`,
            'Yes',
            'No'
          );

          if (proceed === 'Yes') {
            vscode.commands.executeCommand('magusMarkk.cli.tagFiles', filePaths);
          }
        }
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Cost analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  context.subscriptions.push(command);
}
```

### 4. Error Handling and Fallbacks

**Graceful Degradation Strategy:**

```typescript
export class CLIIntegrationManager {
  private cliService?: CLIIntegrationService;
  private fallbackService: CoreTaggingService;
  private cliAvailable = false;

  constructor(context: vscode.ExtensionContext) {
    this.fallbackService = new CoreTaggingService();
    this.initializeCLIService(context);
  }

  private async initializeCLIService(context: vscode.ExtensionContext): Promise<void> {
    try {
      this.cliService = new CLIIntegrationService({
        workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd(),
      });

      const validation = await this.cliService.validateCLI();

      if (validation.available) {
        this.cliAvailable = true;
        vscode.window.showInformationMessage(
          `Magus Mark CLI v${validation.version} detected. Advanced features enabled!`
        );
      } else {
        this.handleCLIUnavailable(validation.error);
      }
    } catch (error) {
      this.handleCLIUnavailable(error instanceof Error ? error.message : String(error));
    }
  }

  private handleCLIUnavailable(error?: string): void {
    const message = `Magus Mark CLI not available. ${error ? `Error: ${error}. ` : ''}Some features will be limited.`;

    vscode.window.showWarningMessage(message, 'Install CLI', 'Continue with Basic Features').then((selection) => {
      if (selection === 'Install CLI') {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-repo/magus-mark#installation'));
      }
    });
  }

  /**
   * Tag files with automatic fallback
   */
  async tagFiles(paths: string[], options: TaggingOptions): Promise<TaggingResult> {
    if (this.cliAvailable && this.cliService) {
      try {
        return await this.cliService.tagFiles(paths, options);
      } catch (error) {
        vscode.window.showWarningMessage(
          `CLI tagging failed: ${error instanceof Error ? error.message : String(error)}. Falling back to basic mode.`
        );
      }
    }

    // Fallback to core implementation
    return this.fallbackService.tagFiles(paths, options);
  }

  /**
   * Get features availability
   */
  getAvailableFeatures(): CLIFeatures {
    return {
      basicTagging: true,
      costEstimation: this.cliAvailable,
      benchmarking: this.cliAvailable,
      analytics: this.cliAvailable,
      advancedWorkflow: this.cliAvailable,
      configurationProfiles: this.cliAvailable,
    };
  }
}

interface CLIFeatures {
  basicTagging: boolean;
  costEstimation: boolean;
  benchmarking: boolean;
  analytics: boolean;
  advancedWorkflow: boolean;
  configurationProfiles: boolean;
}
```

## Command Integration Examples

### VS Code Commands Using CLI

```typescript
// Register all CLI-integrated commands
export function registerCLICommands(context: vscode.ExtensionContext, cliManager: CLIIntegrationManager): void {
  const commands = [
    // Basic tagging with cost awareness
    vscode.commands.registerCommand('magusMarkk.cli.tagWithCostAnalysis', async () => {
      const files = await selectFiles();
      const estimate = await cliManager.getCostEstimate(files);

      if (await confirmCost(estimate)) {
        await cliManager.tagFiles(files, { maxCost: estimate.totalCost });
      }
    }),

    // Advanced benchmarking
    vscode.commands.registerCommand('magusMarkk.cli.runComprehensiveBenchmark', async () => {
      await runBenchmarkWithProgress(cliManager);
    }),

    // Optimization recommendations
    vscode.commands.registerCommand('magusMarkk.cli.optimizeSettings', async () => {
      const analytics = await cliManager.getAnalytics();
      const recommendations = generateOptimizationRecommendations(analytics);
      showOptimizationPanel(recommendations);
    }),

    // Usage analytics dashboard
    vscode.commands.registerCommand('magusMarkk.cli.showAnalyticsDashboard', async () => {
      const analytics = await cliManager.getAnalytics('month');
      showAnalyticsDashboard(analytics);
    }),

    // Bulk processing with progress
    vscode.commands.registerCommand('magusMarkk.cli.bulkProcessWithProgress', async () => {
      await runBulkProcessingWithProgress(cliManager);
    }),
  ];

  context.subscriptions.push(...commands);
}
```

## Benefits Summary

| Feature                      | Core Package | CLI Integration | Benefit                  |
| ---------------------------- | ------------ | --------------- | ------------------------ |
| **Basic Tagging**            | ✅           | ✅              | Same functionality       |
| **Cost Management**          | ❌           | ✅              | Advanced budget controls |
| **Benchmarking**             | ❌           | ✅              | Multi-model comparison   |
| **Analytics**                | ❌           | ✅              | Usage insights           |
| **Workflow Orchestration**   | ❌           | ✅              | Sophisticated processing |
| **Configuration Profiles**   | ❌           | ✅              | Environment management   |
| **Progress Streaming**       | ❌           | ✅              | Real-time updates        |
| **Error Recovery**           | Basic        | ✅              | Advanced retry logic     |
| **Performance Optimization** | ❌           | ✅              | Parameter tuning         |
| **Testing Framework**        | ❌           | ✅              | Quality assurance        |

## Implementation Checklist

### Phase 1: Core Integration

- [ ] Create `CLIIntegrationService` class
- [ ] Implement basic CLI communication
- [ ] Add progress streaming support
- [ ] Create configuration sync service
- [ ] Add error handling and fallbacks

### Phase 2: Advanced Features

- [ ] Integrate cost estimation and management
- [ ] Add benchmarking command support
- [ ] Implement analytics dashboard
- [ ] Create optimization recommendations
- [ ] Add bulk processing with progress

### Phase 3: UI Enhancement

- [ ] Create webview panels for results
- [ ] Add progress indicators in status bar
- [ ] Implement cost warning notifications
- [ ] Create settings UI for CLI configuration
- [ ] Add feature availability indicators

### Phase 4: Testing & Polish

- [ ] Test CLI integration with various scenarios
- [ ] Validate fallback mechanisms
- [ ] Performance test with large file sets
- [ ] User acceptance testing
- [ ] Documentation and tutorials

## Conclusion

CLI integration transforms the VS Code extension from a basic tagging tool into a sophisticated AI-powered development
assistant with advanced cost management, comprehensive benchmarking, and rich analytics capabilities - all without
duplicating any code!

Your Humble Servant, Sebastien
