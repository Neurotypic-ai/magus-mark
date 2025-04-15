/**
 * Error utilities and types for the CLI
 * Re-exports error classes from the core package
 */

// Export error classes
export { AppError } from '@obsidian-magic/core/errors/AppError';
export { CostLimitError } from '@obsidian-magic/core/errors/CostLimitError';
export { ValidationError } from '@obsidian-magic/core/errors/ValidationError';
export { APIError } from '@obsidian-magic/core/errors/APIError';
export { FileSystemError } from '@obsidian-magic/core/errors/FileSystemError';
export { NetworkError } from '@obsidian-magic/core/errors/NetworkError';
export { ConfigurationError } from '@obsidian-magic/core/errors/ConfigurationError';
export { MarkdownError } from '@obsidian-magic/core/errors/MarkdownError';
export { ApiKeyError } from '@obsidian-magic/core/errors/ApiKeyError';
export { TaggingError } from '@obsidian-magic/core/errors/TaggingError';

// Export Result pattern
export { Result } from '@obsidian-magic/core/errors/Result';

// Export utility functions
export { toAppError } from '@obsidian-magic/core/errors/utils';
