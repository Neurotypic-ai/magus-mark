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
        type: 'string',
      })
      .example('$0 example --option-name value', 'Example usage');
  },
  handler: async (argv) => {
    // Command implementation
  },
};
```

## Global Options

The following options are available to all commands:

- `--config`: Path to configuration file
- `--verbose`: Enable verbose output
- `--output-format`: Output format (pretty, json, silent)

## Command: tag

The primary command for processing and tagging conversations with sophisticated cost management and workflow control.

```
tag-conversations tag [paths..] [options]
```

### Arguments

- `paths`: Files or directories to process (required)

### Core Options

| Option               | Type    | Default       | Description                                          |
| -------------------- | ------- | ------------- | ---------------------------------------------------- |
| `--model`            | string  | gpt-4o        | Model to use (gpt-3.5-turbo, gpt-4, gpt-4o)         |
| `--mode`             | string  | auto          | Operation mode (auto, interactive, differential)     |
| `--dry-run`          | boolean | false         | Calculate tokens and estimate cost without processing |
| `--force`            | boolean | false         | Process all files regardless of existing tags        |
| `--concurrency`      | number  | 3             | Number of parallel operations                        |
| `--tag-mode`         | string  | merge         | How to handle existing tags (append, replace, merge) |

### AI Configuration

| Option               | Type    | Default | Description                                     |
| -------------------- | ------- | ------- | ----------------------------------------------- |
| `--min-confidence`   | number  | 0.7     | Minimum threshold for auto-tagging              |
| `--review-threshold` | number  | 0.5     | Confidence below which to flag for review       |

### Cost Management

| Option       | Type   | Default | Description                                  |
| ------------ | ------ | ------- | -------------------------------------------- |
| `--max-cost` | number | -       | Maximum budget for this run in USD          |
| `--on-limit` | string | warn    | Action on hitting limit (pause, warn, stop) |

### Output Control

| Option            | Type   | Default | Description                                  |
| ----------------- | ------ | ------- | -------------------------------------------- |
| `--output-format` | string | pretty  | Output format (pretty, json, silent)        |
| `--verbose`       | boolean| false   | Show detailed progress and debug information |
| `--output`        | string | -       | Save results to specified file              |

### Examples

```bash
# Basic usage with cost limit
tag-conversations tag ./conversations/ --max-cost=5.00

# Interactive mode with specific model
tag-conversations tag ./docs/ --mode=interactive --model=gpt-4

# Dry run to estimate costs
tag-conversations tag ./large-dataset/ --dry-run --verbose

# High concurrency with pause on cost limit
tag-conversations tag ./batch/ --concurrency=8 --max-cost=20.00 --on-limit=pause
```

## Command: config

Manage configuration options with profile support and validation.

```
tag-conversations config <command> [options]
```

### Core Subcommands

- `get [key]`: View configuration values
- `set <key> <value>`: Set configuration values with validation
- `import <file>`: Import configuration from file
- `export [--format=json|yaml] [--output=file]`: Export configuration to file
- `reset`: Reset configuration to defaults

### Profile Management

- `create-profile <name> [options]`: Create a new configuration profile
- `list-profiles`: List all available profiles
- `use-profile <name>`: Switch to a configuration profile
- `delete-profile <name>`: Delete a configuration profile

### Model Validation

- `validate-model [model]`: Validate if a model is available via API

### Examples

```bash
# Set API key with validation
tag-conversations config set apiKey sk-...

# Create a profile for fast processing
tag-conversations config create-profile fast --model=gpt-3.5-turbo --concurrency=5

# Switch to the fast profile
tag-conversations config use-profile fast

# Validate model availability
tag-conversations config validate-model gpt-4o

# Export configuration
tag-conversations config export --format=json --output=backup.json
```

## Command: setup

Interactive configuration setup, alias for `config setup`.

```
magus setup
```

## Command: test

Run comprehensive tests, benchmarks, and performance analysis.

```
tag-conversations test [options]
```

### Test Types

| Option            | Type    | Default | Description                           |
| ----------------- | ------- | ------- | ------------------------------------- |
| `--benchmark`     | boolean | false   | Run performance benchmark             |
| `--integration`   | boolean | false   | Run integration tests                 |
| `--stress-test`   | boolean | false   | Run stress tests with volume control  |
| `--optimize-params` | boolean | false | Run parameter optimization           |

### Configuration Options

| Option            | Type    | Default                 | Description                                      |
| ----------------- | ------- | ----------------------- | ------------------------------------------------ |
| `--samples`       | number  | 10                      | Number of samples to test                        |
| `--models`        | string  | gpt-3.5-turbo,gpt-4     | Comma-separated list of models to test          |
| `--all-models`    | boolean | false                   | Test all available models                        |
| `--compare`       | boolean | false                   | Generate model comparison report                 |
| `--dataset`       | string  | standard                | Dataset to use (standard, edge-case, multilingual, technical) |

### Output Options

| Option            | Type    | Default | Description                           |
| ----------------- | ------- | ------- | ------------------------------------- |
| `--report`        | string  | -       | Path to save detailed report          |
| `--output-format` | string  | pretty  | Output format (pretty, json, silent) |
| `--verbose`       | boolean | false   | Show detailed test output             |

### Advanced Options

| Option                | Type    | Default | Description                                    |
| --------------------- | ------- | ------- | ---------------------------------------------- |
| `--test-set`          | string  | -       | Path to custom test set file or directory     |
| `--tagged-only`       | boolean | false   | Only test files that already have tags        |
| `--accuracy-threshold`| number  | 0.8     | Minimum accuracy threshold to pass tests      |

### Examples

```bash
# Basic benchmark
tag-conversations test --benchmark

# Compare all models with detailed report
tag-conversations test --benchmark --all-models --compare --report=benchmark.json

# Run integration tests
tag-conversations test --integration

# Stress test with high volume
tag-conversations test --stress-test --volume=1000 --concurrency=10

# Optimize parameters
tag-conversations test --optimize-params --parameters=confidence,concurrency

# Technical dataset benchmark
tag-conversations test --benchmark --dataset=technical --samples=50
```

## Command: stats

View comprehensive statistics, usage analytics, and file analysis reports.

```
tag-conversations stats [options]
```

### Time-based Statistics

| Option     | Type   | Default | Description                         |
| ---------- | ------ | ------- | ----------------------------------- |
| `--period` | string | month   | Time period (day, week, month, all) |
| `--type`   | string | all     | Statistics type (usage, cost, all)  |

### File Analysis

| Option       | Type   | Default | Description                           |
| ------------ | ------ | ------- | ------------------------------------- |
| `--directory`| string | -       | Directory to analyze for tag stats   |
| `--format`   | string | table   | Output format (table, json, chart)   |

### Output Control

| Option     | Type    | Default | Description                      |
| ---------- | ------- | ------- | -------------------------------- |
| `--output` | string  | -       | Save results to specified file   |
| `--reset`  | boolean | false   | Reset usage statistics           |

### Examples

```bash
# View monthly usage statistics
tag-conversations stats --period=month --type=all

# Analyze files in a directory
tag-conversations stats --directory=./conversations --format=table

# Export all-time stats to CSV
tag-conversations stats --period=all --output=usage-report.csv

# Reset usage data
tag-conversations stats --reset

# View cost-only statistics for the past week
tag-conversations stats --period=week --type=cost
```

## Command: taxonomy

Manage taxonomy.

```
magus taxonomy <command> [options]
```

### Subcommands

- `list`: List all taxonomies
- `add-domain <domain>`: Add a new domain
- `add-subdomain <domain> <subdomain>`: Add a new subdomain to a domain
- `add-tag <tag>`: Add a new contextual tag

### Options

| Option          | Type   | Description        |
| --------------- | ------ | ------------------ |
| `--description` | string | Domain description |

## Exit Codes

The CLI uses the following exit codes:

| Code | Description         |
| ---- | ------------------- |
| 0    | Success             |
| 1    | General error       |
| 2    | Invalid argument    |
| 3    | API error           |
| 4    | Configuration error |
| 5    | Cost limit exceeded |
