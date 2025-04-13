# Configuration Reference

The Obsidian Magic CLI provides a comprehensive configuration system with multiple layers and flexible options for
customization.

## Configuration System Architecture

The CLI implements a layered configuration system with well-defined precedence:

### Configuration Precedence

Configuration values are resolved in the following order (highest priority first):

1. **Command-line Arguments**: Options provided directly in the command
2. **Environment Variables**: Settings in the current environment
3. **Project Configuration**: Local configuration in the current project
4. **User Configuration**: User-specific settings in the home directory
5. **Default Values**: Built-in defaults for all options

This multi-layered approach allows for flexibility while maintaining consistent behavior.

## Configuration File Locations

The CLI searches for configuration in multiple locations:

```
# Project-level configuration
./tag-conversations.config.js
./tag-conversations.config.json
./tag-conversations.json
./.tag-conversationsrc

# User-level configuration
~/.tag-conversations/config.json
~/.tag-conversationsrc
~/.config/tag-conversations/config.json

# Environment-specific configuration
./tag-conversations.${NODE_ENV}.json
```

## Configuration File Format

Configuration can be specified in JSON format:

```json
{
  "defaultModel": "gpt-3.5-turbo",
  "maxCost": 5.0,
  "concurrency": 3,
  "backupFiles": true,
  "api": {
    "baseUrl": "https://api.openai.com/v1",
    "timeout": 30000
  },
  "tagSettings": {
    "minConfidence": 0.7,
    "maxTags": 10,
    "tagMode": "merge"
  },
  "processing": {
    "defaultMode": "differential",
    "skipExistingTags": true,
    "includePatterns": ["**/*.md"],
    "excludePatterns": ["**/node_modules/**", "**/archive/**"]
  }
}
```

Or in JavaScript format for more advanced configuration:

```javascript
// tag-conversations.config.js
module.exports = {
  defaultModel: process.env.NODE_ENV === 'production' ? 'gpt-4' : 'gpt-3.5-turbo',
  maxCost: 5.0,
  concurrency: require('os').cpus().length - 1, // Dynamic based on system
  processing: {
    defaultMode: 'differential',
    excludePatterns: [
      '**/node_modules/**',
      '**/archive/**',
      // Dynamic pattern based on date
      `**/${new Date().getFullYear() - 1}/**`, // Exclude last year's content
    ],
  },
  // Function to determine tag mode based on file count
  getTagMode: function (fileCount) {
    return fileCount > 100 ? 'augment' : 'merge';
  },
};
```

## Environment Variables

The CLI supports configuration through environment variables:

| Environment Variable              | Description            | Example                                         |
| --------------------------------- | ---------------------- | ----------------------------------------------- |
| `OPENAI_API_KEY`                  | OpenAI API key         | `OPENAI_API_KEY=sk-...`                         |
| `OPENAI_ORG_ID`                   | OpenAI organization ID | `OPENAI_ORG_ID=org-...`                         |
| `TAG_CONVERSATIONS_CONFIG`        | Path to config file    | `TAG_CONVERSATIONS_CONFIG=./custom-config.json` |
| `TAG_CONVERSATIONS_DEFAULT_MODEL` | Default model to use   | `TAG_CONVERSATIONS_DEFAULT_MODEL=gpt-4`         |
| `TAG_CONVERSATIONS_MAX_COST`      | Maximum cost per run   | `TAG_CONVERSATIONS_MAX_COST=10.0`               |
| `TAG_CONVERSATIONS_CONCURRENCY`   | Default concurrency    | `TAG_CONVERSATIONS_CONCURRENCY=5`               |
| `TAG_CONVERSATIONS_LOG_LEVEL`     | Logging level          | `TAG_CONVERSATIONS_LOG_LEVEL=debug`             |
| `TAG_CONVERSATIONS_BACKUP`        | Enable/disable backups | `TAG_CONVERSATIONS_BACKUP=true`                 |
| `TAG_CONVERSATIONS_API_TIMEOUT`   | API timeout in ms      | `TAG_CONVERSATIONS_API_TIMEOUT=60000`           |

Environment variables can be loaded from a `.env` file in the current directory:

```bash
# .env file
OPENAI_API_KEY=sk-your-api-key
TAG_CONVERSATIONS_DEFAULT_MODEL=gpt-4
TAG_CONVERSATIONS_MAX_COST=10.0
```

## Configuration Management Commands

The CLI provides commands for managing configuration:

```bash
# View current configuration
tag-conversations config get

# View specific configuration value
tag-conversations config get defaultModel

# Set configuration value
tag-conversations config set defaultModel gpt-4

# Set nested configuration value
tag-conversations config set "api.timeout" 60000

# Reset configuration to defaults
tag-conversations config reset

# Generate config file with current settings
tag-conversations config init

# Import configuration from file
tag-conversations config import ./config.json

# Export configuration to file
tag-conversations config export --format=json
```

## Configuration Profiles

The CLI supports configuration profiles for different use cases:

```bash
# Create a named profile
tag-conversations config create-profile fast-tagging --model=gpt-3.5-turbo --concurrency=5

# Use a profile
tag-conversations tag ./convos/ --profile=fast-tagging

# List available profiles
tag-conversations config list-profiles

# Delete a profile
tag-conversations config delete-profile fast-tagging
```

Profiles are stored in `~/.tag-conversations/profiles/` and can be shared across projects.

## Command-Line Configuration Options

All configuration options can be specified as command-line arguments:

### Global Options

```bash
# Specify configuration file
tag-conversations --config=./custom-config.json tag ./convos/

# Use configuration profile
tag-conversations --profile=fast-tagging tag ./convos/

# Override API key
tag-conversations --api-key=sk-your-api-key tag ./convos/

# Set log level
tag-conversations --log-level=debug tag ./convos/

# Load specific .env file
tag-conversations --env-file=./.env.production tag ./convos/
```

### Processing Options

```bash
# Set processing mode
tag-conversations tag ./convos/ --mode=interactive

# Specify model
tag-conversations tag ./convos/ --model=gpt-4

# Set concurrency
tag-conversations tag ./convos/ --concurrency=5

# Set maximum cost
tag-conversations tag ./convos/ --max-cost=10.0

# Configure tag handling
tag-conversations tag ./convos/ --tag-mode=merge

# Control backup behavior
tag-conversations tag ./convos/ --backup=true

# Specify custom include/exclude patterns
tag-conversations tag ./convos/ --include="**/*.md" --exclude="**/archive/**"
```

## Validation and Type Safety

The CLI validates configuration against a schema:

```typescript
// Configuration schema definition
const configSchema = z.object({
  defaultModel: z.string().default('gpt-3.5-turbo'),
  maxCost: z.number().positive().default(5.0),
  concurrency: z.number().int().positive().default(3),
  backupFiles: z.boolean().default(true),
  api: z
    .object({
      baseUrl: z.string().url().default('https://api.openai.com/v1'),
      timeout: z.number().int().positive().default(30000),
    })
    .default({}),
  tagSettings: z
    .object({
      minConfidence: z.number().min(0).max(1).default(0.7),
      maxTags: z.number().int().positive().default(10),
      tagMode: z.enum(['overwrite', 'merge', 'augment']).default('merge'),
    })
    .default({}),
  processing: z
    .object({
      defaultMode: z.enum(['auto', 'interactive', 'differential']).default('differential'),
      skipExistingTags: z.boolean().default(true),
      includePatterns: z.array(z.string()).default(['**/*.md']),
      excludePatterns: z.array(z.string()).default(['**/node_modules/**', '**/archive/**']),
    })
    .default({}),
});

// Type definition for strongly typed configuration access
type ConfigSchema = z.infer<typeof configSchema>;
```

## Configuration API

The CLI provides a programmatic API for working with configuration:

```typescript
import { getConfig, resetConfig, setConfig } from '@obsidian-magic/cli';

// Get full configuration
const config = getConfig();
console.log(`Using model: ${config.defaultModel}`);

// Get specific configuration value
const maxCost = getConfig('maxCost');
console.log(`Maximum cost: $${maxCost}`);

// Set configuration value
setConfig('defaultModel', 'gpt-4');

// Set nested configuration value
setConfig('api.timeout', 60000);

// Reset configuration
resetConfig();
```

## Default Configuration

The CLI includes sensible defaults for all configuration options:

```typescript
// Default configuration values
const defaults = {
  // Model settings
  defaultModel: 'gpt-3.5-turbo',
  fallbackModel: 'gpt-3.5-turbo',

  // Cost management
  maxCost: 5.0,
  onCostLimit: 'pause',

  // Processing settings
  concurrency: 3,
  backupFiles: true,

  // API settings
  api: {
    baseUrl: 'https://api.openai.com/v1',
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
  },

  // Tag settings
  tagSettings: {
    minConfidence: 0.7,
    maxTags: 10,
    tagMode: 'merge',
  },

  // Processing settings
  processing: {
    defaultMode: 'differential',
    skipExistingTags: true,
    includePatterns: ['**/*.md'],
    excludePatterns: ['**/node_modules/**', '**/archive/**'],
  },

  // UI settings
  ui: {
    showSpinners: true,
    colorOutput: true,
    progressBars: true,
    verbosity: 'normal',
  },

  // Output settings
  output: {
    format: 'pretty',
    timestamps: false,
  },

  // System settings
  system: {
    tempDir: os.tmpdir(),
    cacheDir: path.join(os.homedir(), '.tag-conversations', 'cache'),
    logFile: path.join(os.homedir(), '.tag-conversations', 'logs', 'cli.log'),
  },
};
```

## Advanced Configuration Use Cases

### Environment-specific Configuration

Create environment-specific configuration files:

```bash
# Development configuration
tag-conversations.development.json

# Production configuration
tag-conversations.production.json

# Test configuration
tag-conversations.test.json
```

Then specify the environment:

```bash
# Use development configuration
NODE_ENV=development tag-conversations tag ./convos/

# Use production configuration
NODE_ENV=production tag-conversations tag ./convos/
```

### Dynamic Configuration

Use JavaScript configuration for dynamic settings:

```javascript
// tag-conversations.config.js
module.exports = {
  // Determine model based on file count
  getModel: function (files) {
    return files.length > 100 ? 'gpt-3.5-turbo' : 'gpt-4';
  },

  // Determine concurrency based on system resources
  getConcurrency: function () {
    const cpus = require('os').cpus().length;
    const memory = require('os').totalmem() / 1024 / 1024 / 1024; // GB

    // Adjust concurrency based on available resources
    if (memory < 4) return 1; // Low memory system
    if (memory < 8) return Math.min(2, cpus - 1); // Medium memory
    return Math.min(5, cpus - 1); // High memory system
  },

  // Customize API timeouts based on model
  getApiTimeout: function (model) {
    if (model.includes('gpt-4')) return 60000; // 60 seconds for GPT-4
    return 30000; // 30 seconds for other models
  },
};
```

### Per-directory Configuration

The CLI supports per-directory configuration, useful for repositories with different requirements:

```
project/
├── team1/
│   └── .tag-conversationsrc  # Team 1 specific configuration
├── team2/
│   └── .tag-conversationsrc  # Team 2 specific configuration
└── .tag-conversationsrc      # Project-wide default configuration
```

When running the CLI in a subdirectory, it will merge configurations from all parent directories, with closer
directories taking precedence.

## Configuration Best Practices

1. **Use Project Configuration**: Store project-specific settings in a version-controlled configuration file
2. **Use Environment Variables**: Store sensitive information like API keys in environment variables or .env files
   (excluded from version control)
3. **Create Profiles**: Define profiles for common use cases to simplify command execution
4. **Validate Settings**: Always validate custom configuration to catch errors early
5. **Document Changes**: Comment configuration files to explain non-obvious settings
6. **Version Control**: Include example configuration files in version control for easy onboarding
