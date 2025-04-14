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