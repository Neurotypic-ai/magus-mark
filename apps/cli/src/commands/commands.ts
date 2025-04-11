/**
 * Command exports for the CLI application
 */

// Export all commands
export * from './tag';
export * from './test';
export * from './stats';
export * from './taxonomy';
export * from './config-interactive';

// Export additional utilities if they exist
export * from './config';
// setup isn't implemented yet

// Import types
import type { CommandModule } from 'yargs';

/**
 * Get all commands for the application
 */
export function getAllCommands(): CommandModule[] {
  // Import commands (handle if some don't exist)
  const commands: CommandModule[] = [];
  
  try {
    const { tagCommand } = require('./tag');
    if (tagCommand) commands.push(tagCommand);
  } catch (error) {
    // Command not implemented
  }
  
  try {
    const { testCommand } = require('./test');
    if (testCommand) commands.push(testCommand);
  } catch (error) {
    // Command not implemented
  }
  
  try {
    const { statsCommand } = require('./stats');
    if (statsCommand) commands.push(statsCommand);
  } catch (error) {
    // Command not implemented
  }
  
  try {
    const { taxonomyCommand } = require('./taxonomy');
    if (taxonomyCommand) commands.push(taxonomyCommand);
  } catch (error) {
    // Command not implemented
  }
  
  try {
    const { configCommand } = require('./config');
    if (configCommand) commands.push(configCommand);
  } catch (error) {
    // Command not implemented
  }
  
  // Setup command is not yet implemented
  /*
  try {
    const { setupCommand } = require('./setup');
    if (setupCommand) commands.push(setupCommand);
  } catch (error) {
    // Command not implemented
  }
  */
  
  return commands;
} 