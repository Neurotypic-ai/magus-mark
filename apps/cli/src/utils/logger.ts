import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import boxen from 'boxen';
import type { Options as BoxenOptions } from 'boxen';
import { config } from './config.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger class for consistent formatted logging
 */
export class Logger {
  private static instance: Logger;
  private spinners: Map<string, Ora> = new Map();
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  /**
   * Log a message at the specified level
   */
  public log(message: string, level: LogLevel = 'info'): void {
    const configLevel = config.get('logLevel');
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    if (levels[level] >= levels[configLevel]) {
      const timestamp = new Date().toISOString();
      let formattedMessage;
      
      switch (level) {
        case 'debug':
          formattedMessage = chalk.gray(`[DEBUG] ${message}`);
          break;
        case 'info':
          formattedMessage = message;
          break;
        case 'warn':
          formattedMessage = chalk.yellow(`WARNING: ${message}`);
          break;
        case 'error':
          formattedMessage = chalk.red(`ERROR: ${message}`);
          break;
      }
      
      if (config.get('outputFormat') !== 'silent') {
        console.log(formattedMessage);
      }
    }
  }
  
  /**
   * Log a debug message
   */
  public debug(message: string): void {
    this.log(message, 'debug');
  }
  
  /**
   * Log an info message
   */
  public info(message: string): void {
    this.log(message, 'info');
  }
  
  /**
   * Log a warning message
   */
  public warn(message: string): void {
    this.log(message, 'warn');
  }
  
  /**
   * Log an error message
   */
  public error(message: string): void {
    this.log(message, 'error');
  }
  
  /**
   * Create a spinner for async operations
   */
  public spinner(text: string, id: string = 'default'): Ora {
    if (config.get('outputFormat') === 'silent') {
      // Return a dummy spinner if in silent mode
      const dummySpinner = ora({ text, isSilent: true });
      this.spinners.set(id, dummySpinner);
      return dummySpinner;
    }
    
    const spinner = ora({ text }).start();
    this.spinners.set(id, spinner);
    return spinner;
  }
  
  /**
   * Update a spinner's text
   */
  public updateSpinner(text: string, id: string = 'default'): void {
    const spinner = this.spinners.get(id);
    if (spinner) {
      spinner.text = text;
    }
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
  
  /**
   * Display a boxed message
   */
  public box(message: string, title?: string): void {
    if (config.get('outputFormat') !== 'silent') {
      const boxed = boxen(message, {
        padding: 1,
        margin: 1,
        borderColor: 'green',
        borderStyle: 'round',
        ...(title ? { title } : {})
      });
      console.log(boxed);
    }
  }
  
  /**
   * Display a JSON object
   */
  public json(data: unknown): void {
    if (config.get('outputFormat') === 'json') {
      console.log(JSON.stringify(data, null, 2));
    } else if (config.get('outputFormat') === 'pretty') {
      console.log(data);
    }
  }
}

export const logger = Logger.getInstance(); 