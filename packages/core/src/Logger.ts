import boxen from 'boxen';
import chalk from 'chalk';
import ora from 'ora';

import type { Options as BoxenOptions } from 'boxen';
import type { Ora } from 'ora';

/**
 * Type definitions for the logger
 */

/**
 * Log level type
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /**
   * Log level
   */
  logLevel: LogLevel;

  /**
   * Output format
   */
  outputFormat: 'pretty' | 'json' | 'silent';
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  logLevel: 'info',
  outputFormat: 'pretty',
};

/**
 * Logger utility
 */
export class Logger {
  private static instance: Logger | undefined;
  private config: LoggerConfig = DEFAULT_CONFIG;
  private spinners = new Map<string, Ora>();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Logger {
    Logger.instance ??= new Logger();
    return Logger.instance;
  }

  /**
   * Configure the logger
   */
  public configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log an info message
   */
  public info(message: string): void {
    if (this.shouldLog('info')) {
      this.log('info', message);
    }
  }

  /**
   * Log a warning message
   */
  public warn(message: string): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message);
    }
  }

  /**
   * Log an error message
   */
  public error(message: string): void {
    if (this.shouldLog('error')) {
      this.log('error', message);
    }
  }

  /**
   * Log a debug message
   */
  public debug(message: string): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message);
    }
  }

  /**
   * Log a success message
   */
  public success(message: string): void {
    if (this.shouldLog('info')) {
      this.log('success', message);
    }
  }

  /**
   * Display content in a box
   */
  public box(content: string, title?: string): void {
    if (this.config.outputFormat === 'silent') return;

    if (this.config.outputFormat === 'json') {
      console.log(JSON.stringify({ type: 'box', content, title }));
      return;
    }

    const options: BoxenOptions = {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      titleAlignment: 'center',
      ...(title ? { title } : {}),
    };

    console.log(boxen(content, options));
  }

  /**
   * Display a table
   */
  public table(data: Record<string, unknown>[], columns?: string[]): void {
    if (this.config.outputFormat === 'silent') return;

    if (this.config.outputFormat === 'json') {
      console.log(JSON.stringify({ type: 'table', data }));
      return;
    }

    console.table(data, columns);
  }

  /**
   * Format a cost value as currency
   */
  public formatCost(value: number): string {
    return `$${value.toFixed(4)}`;
  }

  /**
   * Format tokens count with comma separators
   */
  public formatTokens(tokens: number): string {
    return tokens.toLocaleString();
  }

  /**
   * Create a spinner
   */
  public spinner(text: string, id = 'default'): Ora {
    if (this.config.outputFormat === 'silent') {
      // Return a dummy spinner if in silent mode
      const dummySpinner = ora({ text, isSilent: true });
      this.spinners.set(id, dummySpinner);
      return dummySpinner;
    }

    if (this.spinners.has(id)) {
      const existingSpinner = this.spinners.get(id);
      if (existingSpinner) {
        existingSpinner.text = text;
        return existingSpinner;
      }
    }

    const spinner = ora({ text }).start();
    this.spinners.set(id, spinner);
    return spinner;
  }

  /**
   * Stop a spinner with success
   */
  public succeed(text: string, id = 'default'): void {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.succeed(text);
      this.spinners.delete(id);
    }
  }

  /**
   * Stop a spinner with failure
   */
  public fail(text: string, id = 'default'): void {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.fail(text);
      this.spinners.delete(id);
    }
  }

  /**
   * Log a message
   */
  private log(level: LogLevel | 'success', message: string): void {
    if (this.config.outputFormat === 'json') {
      console.log(JSON.stringify({ level, message }));
      return;
    }

    const timestamp = new Date().toISOString().split('T')[1]?.slice(0, 8) ?? '';

    switch (level) {
      case 'error':
        console.error(`${chalk.gray(timestamp)} ${chalk.red.bold('ERROR')} ${message}`);
        break;
      case 'warn':
        console.warn(`${chalk.gray(timestamp)} ${chalk.yellow.bold('WARN')} ${message}`);
        break;
      case 'info':
        console.info(`${chalk.gray(timestamp)} ${chalk.blue.bold('INFO')} ${message}`);
        break;
      case 'debug':
        console.debug(`${chalk.gray(timestamp)} ${chalk.magenta.bold('DEBUG')} ${message}`);
        break;
      case 'success':
        console.log(`${chalk.gray(timestamp)} ${chalk.green.bold('SUCCESS')} ${message}`);
        break;
    }
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.config.outputFormat === 'silent') return false;

    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex <= currentLevelIndex;
  }
}
