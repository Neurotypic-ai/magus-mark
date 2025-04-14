/**
 * Command exports for the CLI application
 */

// Import all commands
import { configCommand } from './config';
import { configInteractiveCommand } from './config-interactive';
import { statsCommand } from './stats';
import { tagCommand } from './tag';
import { taxonomyCommand } from './taxonomy';
import { testCommand } from './test';

// Import types
import type { CommandModule } from 'yargs';

/**
 * Get all commands for the application
 */
export function getAllCommands(): CommandModule[] {
  // Import commands
  return [tagCommand, testCommand, statsCommand, taxonomyCommand, configCommand, configInteractiveCommand];
}

// Export all commands
export { tagCommand } from './tag';
export { testCommand } from './test';
export { statsCommand } from './stats';
export { taxonomyCommand } from './taxonomy';
export { configCommand } from './config';
export { configInteractiveCommand } from './config-interactive';
