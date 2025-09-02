import chalk from 'chalk';

import { Logger } from '@magus-mark/core/utils/Logger';

import { HealthChecker } from '../enterprise/health/HealthChecker';

import type { CommandModule } from 'yargs';

const logger = Logger.getInstance('health');

interface HealthOptions {
  check?: string;
  format: 'table' | 'json' | 'detailed';
  watch: boolean;
  interval: number;
  fix: boolean;
}

export const healthCommand: CommandModule = {
  command: 'health [check]',
  describe: '🏥 System health monitoring and diagnostics',

  builder: (yargs) => {
    return yargs
      .positional('check', {
        describe: 'Specific health check to run (optional)',
        type: 'string',
      })
      .option('format', {
        describe: 'Output format',
        choices: ['table', 'json', 'detailed'] as const,
        default: 'table' as const,
      })
      .option('watch', {
        describe: 'Continuously monitor health',
        type: 'boolean',
        alias: 'w',
        default: false,
      })
      .option('interval', {
        describe: 'Watch interval in seconds',
        type: 'number',
        default: 30,
      })
      .option('fix', {
        describe: 'Attempt to automatically fix issues',
        type: 'boolean',
        default: false,
      })
      .example('$0 health', 'Run all health checks')
      .example('$0 health openai-api', 'Check OpenAI API connectivity')
      .example('$0 health --watch --interval=60', 'Monitor health every minute')
      .example('$0 health --format=json', 'Output health status as JSON');
  },

  handler: async (argv) => {
    const options = argv as unknown as HealthOptions;
    console.log(chalk.bold.green('🏥 SYSTEM HEALTH DIAGNOSTICS'));
    console.log(chalk.gray('Checking system health and connectivity...'));

    const healthChecker = new HealthChecker();

    try {
      if (options.watch) {
        runContinuousHealthMonitoring(healthChecker, options);
      } else if (options.check) {
        await runSingleHealthCheck(healthChecker, options.check, options);
      } else {
        await runAllHealthChecks(healthChecker, options);
      }
    } catch (error) {
      logger.error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  },
};

async function runAllHealthChecks(healthChecker: HealthChecker, options: HealthOptions): Promise<void> {
  console.log(chalk.cyan('\n🔍 Running comprehensive health assessment...\n'));

  const health = await healthChecker.runAllChecks();

  if (options.format === 'json') {
    console.log(JSON.stringify(health, null, 2));
    return;
  }

  // Display results in table format
  console.log(chalk.bold(`📊 Health Status: ${getStatusIcon(health.overall)} ${health.overall.toUpperCase()}`));
  console.log(chalk.gray(`Timestamp: ${health.timestamp.toISOString()}`));
  console.log();

  // Summary
  console.log(chalk.bold('📋 Summary:'));
  console.log(`   Total Checks: ${health.summary.total.toString()}`);
  console.log(`   ${chalk.green('✅ Passed:')} ${health.summary.passed.toString()}`);
  console.log(`   ${chalk.red('❌ Failed:')} ${health.summary.failed.toString()}`);
  console.log(`   ${chalk.yellow('⚠️  Critical:')} ${health.summary.critical.toString()}`);
  console.log();

  // Individual check results
  console.log(chalk.bold('🔍 Individual Check Results:'));
  for (const [name, result] of Object.entries(health.checks)) {
    const icon = result.healthy ? chalk.green('✅') : chalk.red('❌');
    const duration = `${result.duration.toString()}ms`;

    console.log(`   ${icon} ${name.padEnd(20)} ${result.message} ${chalk.gray(`(${duration})`)}`);

    if (options.format === 'detailed' && result.metadata) {
      console.log(chalk.gray(`      Metadata: ${JSON.stringify(result.metadata, null, 2)}`));
    }
  }

  // Recommendations
  if (health.overall !== 'healthy') {
    console.log(chalk.yellow('\n💡 Recommendations:'));

    for (const [name, result] of Object.entries(health.checks)) {
      if (!result.healthy) {
        console.log(`   • Fix ${name}: ${result.message}`);
      }
    }

    if (options.fix) {
      console.log(chalk.cyan('\n🔧 Attempting automatic fixes...'));
      attemptAutoFix(health);
    }
  }

  console.log(chalk.bold.green('\n✅ Health assessment completed!'));
}

async function runSingleHealthCheck(
  healthChecker: HealthChecker,
  checkName: string,
  options: HealthOptions
): Promise<void> {
  console.log(chalk.cyan(`\n🔍 Running health check: ${checkName}\n`));

  try {
    const result = await healthChecker.runCheck(checkName);

    if (options.format === 'json') {
      console.log(JSON.stringify({ [checkName]: result }, null, 2));
      return;
    }

    const icon = result.healthy ? chalk.green('✅') : chalk.red('❌');
    const status = result.healthy ? 'HEALTHY' : 'UNHEALTHY';

    console.log(`${icon} ${chalk.bold(status)}: ${result.message}`);
    console.log(chalk.gray(`Duration: ${result.duration.toString()}ms`));

    if (result.metadata) {
      console.log(chalk.gray(`Metadata: ${JSON.stringify(result.metadata, null, 2)}`));
    }
  } catch (error) {
    console.log(
      chalk.red(`❌ Health check '${checkName}' failed: ${error instanceof Error ? error.message : String(error)}`)
    );
  }
}

function runContinuousHealthMonitoring(healthChecker: HealthChecker, options: HealthOptions): void {
  console.log(chalk.cyan(`\n👁️  Starting continuous health monitoring (interval: ${options.interval.toString()}s)`));
  console.log(chalk.gray('Press Ctrl+C to stop monitoring\n'));

  let iteration = 0;

  const monitoringInterval = setInterval(() => {
    iteration++;

    void (async () => {
      try {
        console.clear();
        console.log(chalk.bold.cyan(`🏥 CONTINUOUS HEALTH MONITORING - Iteration ${String(iteration)}`));
        console.log(chalk.gray(`Last check: ${new Date().toLocaleTimeString()}\n`));

        const health = await healthChecker.runAllChecks();

        // Display compact status
        const statusIcon = getStatusIcon(health.overall);
        console.log(chalk.bold(`Status: ${statusIcon} ${health.overall.toUpperCase()}`));
        console.log(
          `Checks: ${chalk.green(health.summary.passed.toString())}/${health.summary.total.toString()} passing`
        );

        if (health.summary.failed > 0) {
          console.log(chalk.red(`\n❌ Failed Checks:`));
          for (const [name, result] of Object.entries(health.checks)) {
            if (!result.healthy) {
              console.log(`   • ${name}: ${result.message}`);
            }
          }
        }

        console.log(chalk.gray(`\nNext check in ${options.interval.toString()} seconds... (Ctrl+C to stop)`));
      } catch (error) {
        logger.error(`Health monitoring error: ${error instanceof Error ? error.message : String(error)}`);
      }
    })();
  }, options.interval * 1000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(monitoringInterval);
    console.log(chalk.yellow('\n👋 Health monitoring stopped.'));
    process.exit(0);
  });
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'healthy':
      return '💚';
    case 'degraded':
      return '💛';
    case 'unhealthy':
      return '💔';
    default:
      return '❓';
  }
}

function attemptAutoFix(health: { checks: Record<string, { healthy: boolean; message: string }> }): void {
  for (const [name, result] of Object.entries(health.checks as Record<string, { healthy: boolean; message: string }>)) {
    if (!result.healthy) {
      console.log(chalk.cyan(`🔧 Attempting to fix: ${name}`));

      switch (name) {
        case 'configuration':
          if (result.message.includes('No API key')) {
            console.log(chalk.yellow('   💡 Suggestion: Run "magus-mark setup" to configure your API key'));
          }
          break;

        case 'openai-api':
          if (result.message.includes('API key')) {
            console.log(chalk.yellow('   💡 Suggestion: Check your OpenAI API key configuration'));
          }
          break;

        default:
          console.log(chalk.gray(`   ℹ️  No automatic fix available for ${name}`));
      }
    }
  }
}
