# Magus Mark CLI

> 🔥 **EPIC ANNOUNCEMENT**: This CLI is being transformed into a **GOD TIER** tool! Check out our
> [God Tier Enhancement Plan](../../documentation/cli/god-tier-enhancements.md) featuring Matrix-style dashboards, AI
> intelligence, time-travel debugging, and revolutionary features that will make other CLIs weep in shame.
>
> 📋 **IMPLEMENTATION**: Follow our detailed [Implementation Guide](../../documentation/cli/implementation-guide.md) to
> build the most badass CLI experience ever created.

Command-line tool for processing and tagging conversations in Obsidian markdown files.

## Installation

```bash
# From the repository
cd apps/cli
pnpm link

# Or install globally from pnpm (once published)
pnpm install -g @magus-mark/cli

# Or use without installing
pnpx @magus-mark/cli <command>
```

## Quick Start

```bash
# Set up your configuration (interactive)
magus-mark setup

# Process a single file
magus-mark tag ./path/to/conversation.md

# Process a directory of files
magus-mark tag ./path/to/conversations/
```

## Commands

### `tag`

Process and tag conversations.

```bash
magus-mark tag [paths..] [options]

# Examples
magus-mark tag ./path/to/conversation.md
magus-mark tag ./path/to/conversations/ --mode=differential
magus-mark tag ./convos/ --model=gpt-4 --max-cost=10.00
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
magus-mark config <command> [options]

# Examples
magus-mark config get apiKey
magus-mark config set defaultModel gpt-4
magus-mark config import ./my-config.json
magus-mark config export --format=json
```

Subcommands:

- `get [key]`: View configuration values
- `set <key> <value>`: Set configuration values
- `import <file>`: Import configuration from file
- `export`: Export configuration to file
- `reset`: Reset configuration to defaults
- `setup`: Interactive configuration setup (alias: `magus-mark setup`)

### `test`

Run tests and benchmarks.

```bash
magus-mark test [options]

# Examples
magus-mark test --benchmark
magus-mark test --models=gpt-3.5-turbo,gpt-4 --samples=10
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
magus-mark stats [options]

# Examples
magus-mark stats --period=month
magus-mark stats --type=cost
```

Options:

- `--period`: Time period (day, week, month, all)
- `--type`: Statistics type (usage, cost, all)

### `taxonomy`

Manage taxonomy.

```bash
magus-mark taxonomy <command> [options]

# Examples
magus-mark taxonomy list
magus-mark taxonomy add-domain Programming
```

Subcommands:

- `list`: List all taxonomies
- `add-domain <domain>`: Add a new domain
- `add-subdomain <domain> <subdomain>`: Add a new subdomain
- `add-tag <tag>`: Add a contextual tag

Options:

- `--domain`: Domain name
- `--description`: Domain description
- `--file`: Path to taxonomy file

## Configuration

The CLI can be configured in multiple ways:

1. Interactive setup: `magus-mark setup`
2. Environment variables: `OPENAI_API_KEY=your-key magus-mark`
3. Configuration file: `magus-mark --config=./my-config.json`
4. Direct config commands: `magus-mark config set apiKey your-key`

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
