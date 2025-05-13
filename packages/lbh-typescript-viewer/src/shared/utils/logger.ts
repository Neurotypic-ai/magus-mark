// Logger configuration
const DEBUG = process.env.DEBUG === 'true';

export interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
  error: (message: string, error?: unknown) => void;
}

export class ConsoleLogger implements Logger {
  private prefix?: string;
  private logQueue: (() => void)[] = [];
  private isProcessing = false;

  constructor(prefix?: string) {
    this.prefix = prefix ?? '';
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) return;

    this.isProcessing = true;
    while (this.logQueue.length > 0) {
      const logFn = this.logQueue.shift();
      if (logFn) {
        logFn();
        // Small delay to ensure console output is flushed
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    this.isProcessing = false;
  }

  private queueLog(logFn: () => void): void {
    this.logQueue.push(logFn);
    void this.processQueue();
  }

  private formatMessage(message: string): string {
    return this.prefix ? `[${this.prefix}] ${message}` : message;
  }

  private getCallerLocation(): string {
    const error = new Error();
    const stack = error.stack?.split('\n')[3]?.trim(); // Skip Error, getCallerLocation, and logging function frames
    if (!stack) return '';

    const fullPath = stack.split('at ')[1];
    // Extract path between parentheses if it exists
    const match = /\((.*?)\)/.exec(fullPath);
    if (!match) return `(${fullPath})`;

    // Get the path and find the src/ or similar project root indicator
    const path = match[1];
    const rootIndex = path.indexOf('src/');
    return rootIndex >= 0 ? `(${path.slice(rootIndex)})` : `(${path})`;
  }

  info(message: string, ...args: unknown[]): void {
    const location = this.getCallerLocation();
    this.queueLog(() => {
      console.log(this.formatMessage(message) + ' ' + location, ...args);
    });
  }

  debug(message: string, ...args: unknown[]): void {
    if (DEBUG) {
      const location = this.getCallerLocation();
      this.queueLog(() => {
        console.debug(this.formatMessage(`[DEBUG] ${message}`) + ' ' + location, ...args);
      });
    }
  }

  error(message: string, error?: unknown): void {
    const callerLocation = this.getCallerLocation();
    this.queueLog(() => {
      const errorLocation = error instanceof Error ? error.stack?.split('\n')[1]?.trim() : '';
      console.error(
        this.formatMessage(message) + ' ' + callerLocation,
        error instanceof Error ? error.message : error,
        errorLocation ? `\n    at ${errorLocation}` : ''
      );
    });
  }
}

// Export a default logger instance
export const logger = new ConsoleLogger();

// Export a factory function for creating prefixed loggers
export const createLogger = (prefix: string): Logger => new ConsoleLogger(prefix);
