# Magus Mark CLI

Command-line tool for processing and tagging conversations in Obsidian markdown files.

## Installation

```bash
# From the repository
cd apps/cli
npm link

# Or install globally from npm (once published)
npm install -g @magus-mark/cli

# Or use without installing
npx @magus-mark/cli <command>
```

## Quick Start

```bash
# Set up your configuration (interactive)
tag-conversations setup

# Process a single file
tag-conversations tag ./path/to/conversation.md

# Process a directory of files
tag-conversations tag ./path/to/conversations/
```

## Commands

### `tag`

Process and tag conversations.

```bash
tag-conversations tag [paths..] [options]

# Examples
tag-conversations tag ./path/to/conversation.md
tag-conversations tag ./path/to/conversations/ --mode=differential
tag-conversations tag ./convos/ --model=gpt-4 --max-cost=10.00
```

Options:

- `--model`: Model to use (gpt-3.5-turbo, gpt-4, gpt-4o)
- `--mode`: Operation mode (auto, interactive, differential)
- `--dry-run`: Calculate tokens and estimate cost without processing
- `--force`: Process all files regardless of existing tags
- `--concurrency`: Number of parallel operations (default: 3)
- `--tag-mode`: How to handle existing tags (append, replace, merge)
- `--min-confidence`: Minimum confidence threshold for auto-tagging
- `--review-threshold`: Confidence below which to flag for review
- `--max-cost`: Maximum budget for this run
- `--on-limit`: Action on hitting limit (pause, warn, stop)
- `--output-format`: Output format (pretty, json, silent)
- `--verbose`: Show detailed progress
- `--output`: Save results to specified file

### `config`

Manage configuration.

```bash
tag-conversations config <command> [options]

# Examples
tag-conversations config get apiKey
tag-conversations config set defaultModel gpt-4
tag-conversations config import ./my-config.json
tag-conversations config export --format=json
```

Subcommands:

- `get [key]`: View configuration values
- `set <key> <value>`: Set configuration values
- `import <file>`: Import configuration from file
- `export`: Export configuration to file
- `reset`: Reset configuration to defaults
- `setup`: Interactive configuration setup (alias: `tag-conversations setup`)

### `test`

Run tests and benchmarks.

```bash
tag-conversations test [options]

# Examples
tag-conversations test --benchmark
tag-conversations test --models=gpt-3.5-turbo,gpt-4 --samples=10
```

Options:

- `--benchmark`: Run performance benchmark
- `--samples`: Number of samples to test
- `--test-set`: Path to test set file
- `--models`: Models to test
- `--report`: Path to save report

### `stats`

View statistics and reports.

```bash
tag-conversations stats [options]

# Examples
tag-conversations stats --period=month
tag-conversations stats --type=cost
```

Options:

- `--period`: Time period (day, week, month, all)
- `--type`: Statistics type (usage, cost, all)

### `taxonomy`

Manage taxonomy.

```bash
tag-conversations taxonomy <command> [options]

# Examples
tag-conversations taxonomy list
tag-conversations taxonomy create --domain=Programming
```

Subcommands:

- `list`: List all taxonomies
- `get <domain>`: Get a specific taxonomy
- `create <domain>`: Create a new taxonomy
- `update <domain>`: Update an existing taxonomy
- `delete <domain>`: Delete a taxonomy

Options:

- `--domain`: Domain name
- `--description`: Domain description
- `--file`: Path to taxonomy file

## Configuration

The CLI can be configured in multiple ways:

1. Interactive setup: `tag-conversations setup`
2. Environment variables: `OPENAI_API_KEY=your-key tag-conversations`
3. Configuration file: `tag-conversations --config=./my-config.json`
4. Direct config commands: `tag-conversations config set apiKey your-key`

Configuration is stored in:

- macOS: `~/Library/Preferences/magus-mark-cli-nodejs`
- Windows: `%APPDATA%\magus-mark-cli-nodejs\Config`
- Linux: `~/.config/magus-mark-cli-nodejs`

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/magus-mark.git
cd magus-mark

# Install dependencies
pnpm install

# Build the CLI
pnpm --filter @magus-mark/cli build

# Run tests
pnpm --filter @magus-mark/cli test

# Watch mode for development
pnpm --filter @magus-mark/cli dev
```

## Documentation

For more detailed documentation, see:

- [CLI Overview](../../documentation/cli/cli-overview.md)
- [Command Structure](../../documentation/cli/command-structure.md)
- [Workflow Orchestration](../../documentation/cli/workflow-orchestration.md)
- [Cost Management](../../documentation/cli/cost-management.md)
- [Interactive UI](../../documentation/cli/interactive-ui.md)
- [Configuration Reference](../../documentation/cli/configuration-reference.md)

## Requirements

- Node.js 18 or higher
- OpenAI API key
