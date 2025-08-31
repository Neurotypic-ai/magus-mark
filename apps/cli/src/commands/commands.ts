/**
 * Command exports for the CLI application
 */

// Import all commands
import { analyzeCommand } from './analyze';
import { configCommand } from './config';
import { configInteractiveCommand } from './config-interactive';
import { dashboardStandaloneCommand } from './dashboard-standalone';
import { demoDashboardCommand } from './demo-dashboard';
import { healthCommand } from './health';
import { naturalCommand } from './natural';
import { statsCommand } from './stats';
import { tagCommand } from './tag';
import { taxonomyCommand } from './taxonomy';
import { testCommand } from './test';
import { workflowCommand } from './workflow';

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
    analyzeCommand,
    workflowCommand,
    naturalCommand, // 🧠 Natural Language Interface
    healthCommand, // 🏥 System Health Diagnostics
    dashboardStandaloneCommand, // 🔥 God Tier Dashboard Demo Command
    demoDashboardCommand, // 🚀 Ultimate Standalone Demo
  ];
}

// Export all commands
export { analyzeCommand } from './analyze';
export { configCommand } from './config';
export { configInteractiveCommand } from './config-interactive';
export { dashboardStandaloneCommand } from './dashboard-standalone';
export { demoDashboardCommand } from './demo-dashboard';
export { healthCommand } from './health';
export { naturalCommand } from './natural';
export { statsCommand } from './stats';
export { tagCommand } from './tag';
export { taxonomyCommand } from './taxonomy';
export { testCommand } from './test';
export { workflowCommand } from './workflow';
