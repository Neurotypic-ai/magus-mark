# Yargs Implementation in Obsidian Magic CLI

The Obsidian Magic CLI leverages Yargs to create a powerful, user-friendly command-line interface with rich features, nested commands, and comprehensive help documentation.

## Core Yargs Integration

The CLI architecture uses the latest version of Yargs with TypeScript for type-safe command definitions:

```typescript
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export const cli = yargs(hideBin(process.argv))
  .scriptName('tag-conversations')
  .usage('$0 <command> [options]')
  .strict()
  .demandCommand(1, 'You must specify a command')
  .recommendCommands()
  .middleware(globalMiddleware)
  .fail(handleFailure);
```

## Command Structure

The CLI implements a hierarchical command structure with Yargs:

### Main Commands

```typescript
// Main command registration
cli
  .command(tagCommand)
  .command(testCommand)
  .command(configCommand)
  .command(statsCommand)
  .command(taxonomyCommand);
```

### Nested Commands

```typescript
// Example of nested command structure
const configCommand = {
  command: 'config <action>',
  describe: 'Manage configuration settings',
  builder: (yargs) => {
    return yargs
      .command({
        command: 'set <key> <value>',
        describe: 'Set a configuration value',
        builder: (yargs) => {
          return yargs
            .positional('key', {
              describe: 'Configuration key to set',
              type: 'string'
            })
            .positional('value', {
              describe: 'Value to set',
              type: 'string'
            });
        },
        handler: async (argv) => {
          await configHandlers.setConfig(argv.key, argv.value);
        }
      })
      .command({
        command: 'get [key]',
        describe: 'Get configuration value(s)',
        builder: (yargs) => {
          return yargs
            .positional('key', {
              describe: 'Configuration key to get (omit for all)',
              type: 'string'
            });
        },
        handler: async (argv) => {
          await configHandlers.getConfig(argv.key);
        }
      });
  },
  handler: (argv) => {
    // Show help when no subcommand is provided
    if (argv.action === 'config') {
      yargs.showHelp();
    }
  }
};
```

## Type-Safe Option Definitions

The CLI uses TypeScript to create type-safe option definitions:

```typescript
// Type definitions for command options
interface TagCommandOptions {
  mode: 'auto' | 'interactive' | 'differential';
  model: string;
  dryRun: boolean;
  force: boolean;
  concurrency: number;
  tagMode: 'overwrite' | 'merge' | 'augment';
  minConfidence: number;
  maxCost: number;
  onLimit: 'pause' | 'warn' | 'stop';
  format: 'pretty' | 'json' | 'silent';
  verbose: boolean;
  output?: string;
}

// Type-safe command builder
const tagCommand = {
  command: 'tag [paths..]',
  describe: 'Tag conversations in the provided paths',
  builder: (yargs: Argv<{}>): Argv<TagCommandOptions> => {
    return yargs
      .positional('paths', {
        describe: 'Files or directories to process',
        type: 'string',
        array: true,
        demandOption: true
      })
      .options({
        mode: {
          describe: 'Processing mode',
          choices: ['auto', 'interactive', 'differential'] as const,
          default: 'auto',
          type: 'string'
        },
        model: {
          describe: 'Model to use for classification',
          type: 'string',
          default: 'gpt-3.5-turbo'
        },
        // Other options...
      });
  },
  handler: async (argv: ArgumentsCamelCase<TagCommandOptions>) => {
    await tagHandler(argv);
  }
};
```

## Command Middleware

The CLI leverages Yargs middleware for cross-cutting concerns:

```typescript
// Global middleware applied to all commands
const globalMiddleware = (argv: Arguments) => {
  // Setup logging based on log level
  if (argv.logLevel) {
    configureLogger(argv.logLevel);
  }
  
  // Load environment variables
  if (argv.envFile) {
    dotenv.config({ path: argv.envFile });
  } else {
    dotenv.config();
  }
  
  // Initialize global services
  initializeServices(argv);
  
  return argv;
};

// Command-specific middleware
const tagCommandMiddleware = (argv: Arguments<TagCommandOptions>) => {
  // Verify API credentials before processing
  checkApiCredentials();
  
  // Normalize paths for processing
  argv.paths = normalizePaths(argv.paths);
  
  return argv;
};
```

## Advanced Yargs Features

The CLI leverages advanced Yargs features for a polished user experience:

### Progressive Disclosure

```typescript
// Progressive disclosure example
const showAdvancedOptions = (argv: Arguments) => {
  return argv.advanced || argv.expert;
};

yargs.options({
  // Basic options always shown
  model: {
    describe: 'Model to use for classification',
    type: 'string',
    group: 'Basic Options:'
  },
  
  // Advanced options only shown when requested
  temperature: {
    describe: 'Temperature setting for model',
    type: 'number',
    hidden: !showAdvancedOptions,
    group: 'Advanced Options:'
  },
  maxTokens: {
    describe: 'Maximum tokens for completion',
    type: 'number',
    hidden: !showAdvancedOptions,
    group: 'Advanced Options:'
  }
});
```

### Auto-completion

The CLI implements shell auto-completion using Yargs:

```typescript
// Register completion command
yargs.completion('completion', 'Generate shell completion script');

// Custom completion logic for specific arguments
yargs.options({
  model: {
    describe: 'Model to use for classification',
    type: 'string',
    choices: getAvailableModels() // Dynamically generated choices
  }
});
```

### Usage Instructions

The CLI provides rich usage examples:

```typescript
// Configuring usage examples
yargs
  .example('$0 tag ./conversations/', 'Tag all conversations in directory')
  .example(
    '$0 tag ./conversations/ --model=gpt-4',
    'Use GPT-4 for tagging'
  )
  .example(
    '$0 tag ./conversations/ --mode=interactive',
    'Process files with interactive prompts'
  );
```

### Validation

The CLI implements robust argument validation:

```typescript
// Option validation
yargs.options({
  minConfidence: {
    describe: 'Minimum confidence threshold',
    type: 'number',
    default: 0.7,
    check: (value) => {
      if (value < 0 || value > 1) {
        throw new Error('Confidence must be between 0 and 1');
      }
      return true;
    }
  },
  maxCost: {
    describe: 'Maximum budget for this run',
    type: 'number',
    check: (value) => {
      if (value <= 0) {
        throw new Error('Max cost must be greater than 0');
      }
      return true;
    }
  }
});

// Custom validator middleware
const validatePaths = (argv: Arguments<{ paths: string[] }>) => {
  for (const path of argv.paths) {
    if (!fs.existsSync(path)) {
      throw new Error(`Path does not exist: ${path}`);
    }
  }
  return argv;
};
```

## Error Handling

The CLI implements custom error handling for Yargs:

```typescript
// Custom error handler
const handleFailure = (msg: string, err: Error, yargs: any) => {
  if (err) {
    if (process.env.DEBUG) {
      console.error(chalk.red('Error:'), err);
    } else {
      console.error(chalk.red('Error:'), err.message);
    }
  } else {
    console.error(chalk.red('Error:'), msg);
  }
  console.error('\nUse --help for more information');
  process.exit(1);
};
```

## Help and Documentation

The CLI implements rich help documentation:

```typescript
// Configure help output
yargs
  .help('help', 'Show help')
  .alias('help', 'h')
  .updateStrings({
    'Options:': chalk.bold('Options:'),
    'Commands:': chalk.bold('Commands:'),
    'Examples:': chalk.bold('Examples:')
  })
  .epilogue(
    `For more information, visit the documentation:\n${chalk.blue('https://github.com/obsidian-magic/docs')}`
  );
```

## Interactive Features

The CLI enhances Yargs with interactive features:

```typescript
// Interactive command prompt example
import inquirer from 'inquirer';

const promptForModel = async (argv: Arguments) => {
  if (argv.model) return argv;
  
  const { model } = await inquirer.prompt([
    {
      type: 'list',
      name: 'model',
      message: 'Select model for tagging:',
      choices: [
        { name: 'gpt-3.5-turbo ($0.56 estimated) - Recommended', value: 'gpt-3.5-turbo' },
        { name: 'gpt-4-turbo-preview ($2.14 estimated) - Higher accuracy', value: 'gpt-4-turbo-preview' },
        { name: 'gpt-4 ($4.28 estimated) - Legacy model', value: 'gpt-4' }
      ]
    }
  ]);
  
  argv.model = model;
  return argv;
};
```

## Configuration Integration

The CLI integrates configuration management with Yargs:

```typescript
// Load config file and merge with command line arguments
import { cosmiconfig } from 'cosmiconfig';

const loadConfig = async (argv: Arguments) => {
  const explorer = cosmiconfig('tag-conversations');
  let config = {};
  
  // Try loading from specified config file
  if (argv.config) {
    const result = await explorer.load(argv.config);
    config = result?.config || {};
  } else {
    // Search for config in standard locations
    const result = await explorer.search();
    config = result?.config || {};
  }
  
  // Merge config with command line args (cli args take precedence)
  return { ...config, ...argv };
};
```

## Parser Configuration

The CLI customizes the Yargs parser for optimal behavior:

```typescript
// Configure yargs parser behavior
yargs
  .parserConfiguration({
    'camel-case-expansion': true,
    'short-option-groups': true,
    'strip-aliased': true,
    'strip-dashed': true,
    'halt-at-non-option': false,
    'unknown-options-as-args': false
  });
```

## Best Practices Implementation

The CLI follows Yargs best practices:

1. **Consistent Command Structure**: Uses consistent verb-noun pattern for commands
2. **Grouped Options**: Organizes related options into logical groups
3. **Sensible Defaults**: Provides reasonable defaults for all options
4. **Rich Documentation**: Includes detailed descriptions for all commands and options
5. **Progressive Complexity**: Exposes basic functionality by default, with advanced options available when needed
6. **Validation and Feedback**: Validates input early and provides clear error messages
7. **Type Safety**: Leverages TypeScript for type-safe command definitions

## Integration with CLI Components

The CLI integrates Yargs with other CLI components:

```typescript
// Integration with CLI progress bars
import cliProgress from 'cli-progress';

const tagHandler = async (argv: Arguments<TagCommandOptions>) => {
  // Calculate number of files to process
  const files = await getFilesToProcess(argv.paths);
  
  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: 'Processing: [{bar}] {percentage}% | {value}/{total} files | ETA: {eta}s',
    barCompleteChar: '=',
    barIncompleteChar: ' '
  });
  
  progressBar.start(files.length, 0);
  
  // Process files with progress updates
  for (const file of files) {
    await processFile(file, argv);
    progressBar.increment();
  }
  
  progressBar.stop();
};
```

The CLI architecture with Yargs is designed to be maintainable, extensible, and user-friendly, providing a professional command-line experience for Obsidian Magic users. 