/**
 * Core utilities and modules for the CLI
 * Re-exports all core functionality used by the CLI
 */

// Export logger
export { logger } from './logger';

// Export errors
export * from './errors';

// Export file utilities
export * from './file-utils';

// Export tagging functionality
export * from './tagging';

// Export OpenAI client
export * from './openai';

// Re-export the initializeCore function directly since it's the only function
// that should be imported directly from core
export { initializeCore, VERSION } from '@obsidian-magic/core';
