/**
 * Logger utility for the CLI
 * Provides a shared logger instance across the CLI application
 */
import { Logger } from '@obsidian-magic/core/utils/Logger';

// Export core types
export type { LogLevel, LoggerConfig } from '@obsidian-magic/core/utils/Logger';

// Create and export singleton logger instance
export const logger = Logger.getInstance();
