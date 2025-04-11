# CLI Command Structure & Options

The Obsidian Magic CLI implements a comprehensive command structure with nested commands, option groups, and rich documentation.

## Main Command Groups

```bash
# Tag conversations
tag-conversations tag [paths...] [options]

# Run tests and benchmarks
tag-conversations test [options]

# Manage configuration
tag-conversations config [command] [options]

# View statistics and reports
tag-conversations stats [options]

# Taxonomy management
tag-conversations taxonomy [command] [options]
```

## Tagging Command Options

```bash
# Basic usage
tag-conversations tag ./convos/ --model=gpt-3.5-turbo

# Core options
--model <name>           # Model to use for classification
--mode <mode>            # Operation mode: auto|interactive|differential
--dry-run                # Calculate tokens and estimate cost without processing
--force                  # Process all files regardless of existing tags
--concurrency <num>      # Number of parallel operations (default: 3)

# Tag handling
--tag-mode <mode>        # How to handle existing tags: overwrite|merge|augment
--min-confidence <0-1>   # Minimum confidence threshold for auto-tagging
--review-threshold <0-1> # Confidence below which to flag for review

# Cost management
--max-cost <dollars>     # Maximum budget for this run
--on-limit <action>      # Action on hitting limit: pause|warn|stop

# Output control
--format <format>        # Output format: pretty|json|silent
--verbose                # Show detailed progress
--output <file>          # Save results to specified file
```

## Test/Benchmark Command

```bash
# Run standard tests
tag-conversations test --samples=20

# Comprehensive benchmark
tag-conversations test --benchmark --all-models --report=report.json

# Test options
--samples <number>       # Number of samples to process
--test-set <path>        # Path to test set with known classifications
--models <model,model>   # Models to test
--benchmark              # Run full benchmark suite
--report <file>          # Save detailed results to file
```

## Configuration Commands

```bash
# Set configuration values
tag-conversations config set api-key <key>
tag-conversations config set default-model gpt-4

# View current configuration
tag-conversations config get
tag-conversations config get default-model

# Import/export configuration
tag-conversations config import ./config.json
tag-conversations config export --format=json
```

## Taxonomy Management

```bash
# List all domains
tag-conversations taxonomy list domains

# Add new domain
tag-conversations taxonomy add domain <name> --description="..."

# Import taxonomy updates
tag-conversations taxonomy import ./updated-taxonomy.json
```

## Global Options

Options that apply to all commands:

```bash
--help                   # Show help for command
--version                # Show version number
--config <path>          # Use specified config file
--log-level <level>      # Set log level: debug|info|warn|error
```

## Environment Variables

The CLI supports the following environment variables:

- `OPENAI_API_KEY` - OpenAI API key for tagging
- `OPENAI_ORG_ID` - Optional organization ID for OpenAI API
- `TAG_CONVERSATIONS_CONFIG` - Path to config file
- `TAG_CONVERSATIONS_LOG_LEVEL` - Log level
- `TAG_CONVERSATIONS_MAX_COST` - Maximum cost in dollars

Environment variables can be loaded from a `.env` file in the current directory or specified with `--env-file`.

## Progressive Disclosure

The CLI implements progressive disclosure of complexity:

- Basic commands are simple to use with good defaults
- Advanced options are available but not required
- Help documentation is comprehensive at every level
- Examples are provided for common use cases

Command documentation is accessible through `--help` flags at any level of the command hierarchy. 