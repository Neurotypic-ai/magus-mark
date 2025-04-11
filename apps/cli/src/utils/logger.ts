import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import boxen from 'boxen';
import { config } from './config.js';
import type { LogLevel } from '../types/commands';

/**
 * Logger utility for consistent CLI output
 */
class Logger {
  private logLevel: LogLevel = 'info';
  private outputFormat: 'pretty' | 'json' | 'silent' = 'pretty';
  private spinners: Map<string, Ora> = new Map();
  
  /**
   * Configure the logger
   */
  configure(options: { 
    logLevel?: LogLevel; 
    outputFormat?: 'pretty' | 'json' | 'silent';
  }) {
    if (options.logLevel) {
      this.logLevel = options.logLevel;
    }
    
    if (options.outputFormat) {
      this.outputFormat = options.outputFormat;
    }
  }
  
  /**
   * Log an info message
   */
  info(message: string) {
    if (this.shouldLog('info')) {
      this.log('info', message);
    }
  }
  
  /**
   * Log a warning message
   */
  warn(message: string) {
    if (this.shouldLog('warn')) {
      this.log('warn', message);
    }
  }
  
  /**
   * Log an error message
   */
  error(message: string) {
    if (this.shouldLog('error')) {
      this.log('error', message);
    }
  }
  
  /**
   * Log a debug message
   */
  debug(message: string) {
    if (this.shouldLog('debug')) {
      this.log('debug', message);
    }
  }
  
  /**
   * Log a success message
   */
  success(message: string) {
    if (this.shouldLog('info')) {
      this.log('success', message);
    }
  }
  
  /**
   * Display content in a box
   */
  box(content: string, title?: string) {
    if (this.outputFormat === 'silent') return;
    
    if (this.outputFormat === 'json') {
      console.log(JSON.stringify({ type: 'box', content, title }));
      return;
    }
    
    const options: boxen.Options = {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      titleAlignment: 'center'
    };
    
    if (title) {
      options.title = title;
    }
    
    console.log(boxen(content, options));
  }
  
  /**
   * Display a table
   */
  table(data: Record<string, any>[], columns?: string[]) {
    if (this.outputFormat === 'silent') return;
    
    if (this.outputFormat === 'json') {
      console.log(JSON.stringify({ type: 'table', data }));
      return;
    }
    
    console.table(data, columns);
  }
  
  /**
   * Format a cost value as currency
   */
  formatCost(value: number): string {
    return `$${value.toFixed(4)}`;
  }
  
  /**
   * Format tokens count with comma separators
   */
  formatTokens(tokens: number): string {
    return tokens.toLocaleString();
  }
  
  private shouldLog(level: LogLevel): boolean {
    if (this.outputFormat === 'silent') return false;
    
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex <= currentLevelIndex;
  }
  
  private log(level: LogLevel | 'success', message: string) {
    if (this.outputFormat === 'json') {
      console.log(JSON.stringify({ level, message }));
      return;
    }
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    
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
   * Create or update a spinner
   */
  spinner(text: string, id: string = 'default'): Ora {
    if (this.outputFormat === 'silent') {
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
  public succeed(text: string, id: string = 'default'): void {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.succeed(text);
      this.spinners.delete(id);
    }
  }
  
  /**
   * Stop a spinner with failure
   */
  public fail(text: string, id: string = 'default'): void {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.fail(text);
      this.spinners.delete(id);
    }
  }
}

export const logger = new Logger(); 