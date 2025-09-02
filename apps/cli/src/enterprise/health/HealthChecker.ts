import { EventEmitter } from 'events';
import * as os from 'os';

import { OpenAIClient } from '@magus-mark/core/openai/OpenAIClient';
import { Logger } from '@magus-mark/core/utils/Logger';

export interface HealthCheck {
  name: string;
  description: string;
  check: () => Promise<HealthResult>;
  critical: boolean;
  timeout: number;
}

export interface HealthResult {
  healthy: boolean;
  message: string;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, HealthResult>;
  timestamp: Date;
  summary: {
    total: number;
    passed: number;
    failed: number;
    critical: number;
  };
}

export class HealthChecker extends EventEmitter {
  private checks = new Map<string, HealthCheck>();
  private logger: Logger;
  private lastResults = new Map<string, HealthResult>();

  constructor() {
    super();
    this.logger = Logger.getInstance('health-checker');
    this.initializeDefaultChecks();
  }

  private initializeDefaultChecks(): void {
    // OpenAI API connectivity
    this.addCheck({
      name: 'openai-api',
      description: 'OpenAI API connectivity and authentication',
      critical: true,
      timeout: 10000,
      check: async () => {
        const startTime = Date.now();
        try {
          const apiKey = process.env['OPENAI_API_KEY'];
          if (!apiKey) {
            return {
              healthy: false,
              message: 'OpenAI API key not configured',
              duration: Date.now() - startTime,
            };
          }

          const client = new OpenAIClient({ apiKey, model: 'gpt-3.5-turbo' });

          // Simple API test - list models
          const models = await client.getAvailableModels();

          return {
            healthy: true,
            message: `API accessible, ${models.length.toString()} models available`,
            duration: Date.now() - startTime,
            metadata: { modelCount: models.length },
          };
        } catch (error) {
          return {
            healthy: false,
            message: `API check failed: ${error instanceof Error ? error.message : String(error)}`,
            duration: Date.now() - startTime,
          };
        }
      },
    });

    // Configuration health
    this.addCheck({
      name: 'configuration',
      description: 'Configuration file and settings validation',
      critical: false,
      timeout: 5000,
      check: async () => {
        const startTime = Date.now();
        try {
          const { config } = await import('../../utils/config');
          const configData = config.getAll();

          const issues: string[] = [];

          if (!configData.apiKey && !process.env['OPENAI_API_KEY']) {
            issues.push('No API key configured');
          }

          if (configData.concurrency && (configData.concurrency < 1 || configData.concurrency > 10)) {
            issues.push('Invalid concurrency setting');
          }

          return {
            healthy: issues.length === 0,
            message: issues.length === 0 ? 'Configuration is valid' : `Issues found: ${issues.join(', ')}`,
            duration: Date.now() - startTime,
            metadata: { issueCount: issues.length, issues },
          };
        } catch (error) {
          return {
            healthy: false,
            message: `Configuration check failed: ${error instanceof Error ? error.message : String(error)}`,
            duration: Date.now() - startTime,
          };
        }
      },
    });

    // File system access
    this.addCheck({
      name: 'filesystem',
      description: 'File system read/write permissions',
      critical: false,
      timeout: 5000,
      check: async () => {
        const startTime = Date.now();
        try {
          const fs = await import('fs/promises');
          const path = await import('path');
          const os = await import('os');

          const testDir = path.join(os.tmpdir(), 'magus-mark-health-check');
          const testFile = path.join(testDir, 'test.txt');

          // Test write
          await fs.mkdir(testDir, { recursive: true });
          await fs.writeFile(testFile, 'health check test');

          // Test read
          const content = await fs.readFile(testFile, 'utf-8');

          // Cleanup
          await fs.unlink(testFile);
          await fs.rmdir(testDir);

          return {
            healthy: content === 'health check test',
            message: 'File system access is working',
            duration: Date.now() - startTime,
          };
        } catch (error) {
          return {
            healthy: false,
            message: `File system check failed: ${error instanceof Error ? error.message : String(error)}`,
            duration: Date.now() - startTime,
          };
        }
      },
    });

    // Memory usage
    this.addCheck({
      name: 'memory',
      description: 'Memory usage and availability',
      critical: false,
      timeout: 1000,
      check: async () => {
        const startTime = Date.now();
        const memUsage = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();

        const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        const systemUsagePercent = ((totalMem - freeMem) / totalMem) * 100;

        const healthy = heapUsagePercent < 90 && systemUsagePercent < 95;

        return Promise.resolve({
          healthy,
          message: healthy ? 'Memory usage is normal' : 'High memory usage detected',
          duration: Date.now() - startTime,
          metadata: {
            heapUsagePercent: heapUsagePercent.toFixed(1),
            systemUsagePercent: systemUsagePercent.toFixed(1),
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          },
        });
      },
    });
  }

  addCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
    this.logger.debug(`Added health check: ${check.name}`);
  }

  removeCheck(name: string): void {
    this.checks.delete(name);
    this.lastResults.delete(name);
    this.logger.debug(`Removed health check: ${name}`);
  }

  async runCheck(name: string): Promise<HealthResult> {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    this.logger.debug(`Running health check: ${name}`);

    try {
      const result = await Promise.race([
        check.check(),
        new Promise<HealthResult>((_, reject) =>
          setTimeout(() => {
            reject(new Error('Health check timeout'));
          }, check.timeout)
        ),
      ]);

      this.lastResults.set(name, result);
      this.emit('check:completed', name, result);

      return result;
    } catch (error) {
      const result: HealthResult = {
        healthy: false,
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: check.timeout,
      };

      this.lastResults.set(name, result);
      this.emit('check:failed', name, result);

      return result;
    }
  }

  async runAllChecks(): Promise<SystemHealth> {
    this.logger.info('Running all health checks');
    const startTime = Date.now();

    const checkPromises = Array.from(this.checks.keys()).map(async (name) => {
      const result = await this.runCheck(name);
      return { name, result };
    });

    const checkResults = await Promise.all(checkPromises);

    const checks: Record<string, HealthResult> = {};
    let passed = 0;
    let failed = 0;
    let critical = 0;

    for (const { name, result } of checkResults) {
      checks[name] = result;

      if (result.healthy) {
        passed++;
      } else {
        failed++;
        const check = this.checks.get(name);
        if (check?.critical) {
          critical++;
        }
      }
    }

    const overall = this.determineOverallHealth(passed, failed, critical);

    const systemHealth: SystemHealth = {
      overall,
      checks,
      timestamp: new Date(),
      summary: {
        total: this.checks.size,
        passed,
        failed,
        critical,
      },
    };

    this.logger.info(
      `Health check completed in ${(Date.now() - startTime).toString()}ms. Status: ${overall.toUpperCase()}`
    );
    this.emit('health:updated', systemHealth);

    return systemHealth;
  }

  private determineOverallHealth(
    _passed: number,
    failed: number,
    critical: number
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (critical > 0) {
      return 'unhealthy';
    }

    if (failed > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  getLastResults(): Record<string, HealthResult> {
    const results: Record<string, HealthResult> = {};
    for (const [name, result] of this.lastResults.entries()) {
      results[name] = result;
    }
    return results;
  }

  getCheckNames(): string[] {
    return Array.from(this.checks.keys());
  }
}
