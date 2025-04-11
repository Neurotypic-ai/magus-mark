# Command Structure

The CLI uses a hierarchical command structure with Yargs to provide a consistent and intuitive interface.

## Command Organization

Commands are organized into logical groups:

- **Core Operations**: `tag` - The primary functionality of tagging conversations
- **Configuration**: `config`, `setup` - Managing settings and preferences
- **Analysis & Reporting**: `stats`, `test` - Performance analysis and usage statistics
- **Knowledge Management**: `taxonomy` - Managing tag taxonomies and classification schemes

## Command Implementation

Each command is implemented as a Yargs CommandModule with:
- Command name and description
- Builder function defining options and examples
- Handler function implementing the command logic

```typescript
export const exampleCommand: CommandModule = {
  command: 'example [options]',
  describe: 'Example command description',
  builder: (yargs) => {
    return yargs
      .option('option-name', {
        describe: 'Description of option',
        type: 'string'
      })
      .example('$0 example --option-name value', 'Example usage');
  },
  handler: async (argv) => {
    // Command implementation
  }
};
```

## Global Options

The following options are available to all commands:

- `--config`: Path to configuration file
- `--verbose`: Enable verbose output
- `--output-format`: Output format (pretty, json, silent)

## Command: tag

The primary command for processing and tagging conversations.

```
tag-conversations tag [paths..] [options]
```

### Arguments

- `paths`: Files or directories to process (required)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--model` | string | gpt-3.5-turbo | Model to use (gpt-3.5-turbo, gpt-4, gpt-4o) |
| `--mode` | string | auto | Operation mode (auto, interactive, differential) |
| `--dry-run` | boolean | false | Calculate tokens without processing |
| `--force` | boolean | false | Process all files regardless of existing tags |
| `--concurrency` | number | 3 | Number of parallel operations |
| `--tag-mode` | string | merge | How to handle existing tags (append, replace, merge) |
| `--min-confidence` | number | 0.7 | Minimum threshold for auto-tagging |
| `--review-threshold` | number | 0.5 | Confidence below which to flag for review |
| `--max-cost` | number | - | Maximum budget for this run |
| `--on-limit` | string | warn | Action on hitting limit (pause, warn, stop) |
| `--output` | string | - | Save results to specified file |

## Command: config

Manage configuration options.

```
tag-conversations config <command> [options]
```

### Subcommands

- `get [key]`: View configuration values
- `set <key> <value>`: Set configuration values
- `import <file>`: Import configuration from file
- `export`: Export configuration to file
- `reset`: Reset configuration to defaults

## Command: setup

Interactive configuration setup, alias for `config setup`.

```
tag-conversations setup
```

## Command: test

Run tests and benchmarks.

```
tag-conversations test [options]
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--benchmark` | boolean | false | Run performance benchmark |
| `--samples` | number | 5 | Number of samples to test |
| `--test-set` | string | - | Path to test set file |
| `--models` | string | - | Comma-separated list of models to test |
| `--report` | string | - | Path to save report |

## Command: stats

View statistics and reports.

```
tag-conversations stats [options]
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--period` | string | month | Time period (day, week, month, all) |
| `--type` | string | all | Statistics type (usage, cost, all) |

## Command: taxonomy

Manage taxonomy.

```
tag-conversations taxonomy <command> [options]
```

### Subcommands

- `list`: List all taxonomies
- `get <domain>`: Get a specific taxonomy
- `create <domain>`: Create a new taxonomy
- `update <domain>`: Update an existing taxonomy
- `delete <domain>`: Delete a taxonomy

### Options

| Option | Type | Description |
|--------|------|-------------|
| `--domain` | string | Domain name |
| `--description` | string | Domain description |
| `--file` | string | Path to taxonomy file |

## Exit Codes

The CLI uses the following exit codes:

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid argument |
| 3 | API error |
| 4 | Configuration error |
| 5 | Cost limit exceeded 