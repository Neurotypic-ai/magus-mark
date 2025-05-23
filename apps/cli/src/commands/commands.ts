/**
 * Command exports for the CLI application
 */

// Import all commands
import { configCommand } from './config';
import { configInteractiveCommand } from './config-interactive';
import { dashboardStandaloneCommand } from './dashboard-standalone';
import { demoDashboardCommand } from './demo-dashboard';
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
  return [
    tagCommand,
    testCommand,
    statsCommand,
    taxonomyCommand,
    configCommand,
    configInteractiveCommand,
    dashboardStandaloneCommand, // 🔥 God Tier Dashboard Demo Command
    demoDashboardCommand, // 🚀 Ultimate Standalone Demo
  ];
}

// Export all commands
export { tagCommand } from './tag';
export { testCommand } from './test';
export { statsCommand } from './stats';
export { taxonomyCommand } from './taxonomy';
export { configCommand } from './config';
export { configInteractiveCommand } from './config-interactive';
export { dashboardStandaloneCommand } from './dashboard-standalone';
export { demoDashboardCommand } from './demo-dashboard';
