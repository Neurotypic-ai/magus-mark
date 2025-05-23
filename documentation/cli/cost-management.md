# CLI Cost Management System

The Obsidian Magic CLI implements a sophisticated, real-time cost management and estimation system to ensure predictable and optimized API usage. The system provides accurate token counting, budget enforcement, and comprehensive usage analytics.

## Token Estimation

The system uses OpenAI's official tokenization approach for accurate cost prediction:

### Precise Token Counting

- Uses `tiktoken` (OpenAI's official tokenizer) for accurate token counting
- Performs model-specific tokenization since different models count tokens differently 
- Pre-calculates token counts for all files before processing begins
- Accounts for both prompt tokens and expected completion tokens

### Token Estimation Output

The CLI provides detailed token usage estimates before processing:

```
📊 Token Usage Estimate
├── Files to process: 128
├── Total input tokens: ~245,780
├── Estimated prompt tokens: ~267,350 (includes instructions)
├── Estimated completion tokens: ~15,360
│
├── Model: gpt-3.5-turbo
│   └── Estimated cost: $0.56 USD
├── Model: gpt-4-turbo-preview
│   └── Estimated cost: $2.14 USD
│
├── Recommended model for this batch: gpt-3.5-turbo
│   (Classification tasks typically work well with this model)
```

## Token Optimization

The system includes strategies to optimize token usage for long conversations:

### Content Optimization

- Extracts key segments based on semantic importance
- Summarizes lengthy sections while preserving topical indicators
- Prioritizes conversation beginnings and conclusions

### Statistics and Savings

- Provides token reduction statistics and estimated savings
- Compares different optimization approaches
- Shows potential savings by model selection

## Real-time Monitoring

The CLI tracks usage in real-time during processing with sophisticated budget enforcement:

### Live Cost Tracking

- **Actual API usage monitoring**: Tracks real token consumption and costs during processing
- **Real vs. estimated comparison**: Continuously compares actual costs against initial estimates
- **Session cost accumulation**: Maintains running totals with detailed model-specific breakdown
- **Per-file cost attribution**: Records individual file processing costs for detailed analysis

### Advanced Budget Controls

- **Configurable cost limits**: Set hard limits with automatic warning thresholds (default 80%)
- **Dynamic budget enforcement**: Real-time checking against limits with immediate action
- **Session persistence**: Maintains cost data across processing sessions and resumable operations
- **Multi-level warnings**: Progressive alerts as costs approach configured limits

### Budget Enforcement Actions

Configure automatic responses when approaching or exceeding limits:

```bash
# Set maximum spend with warning at 80% ($4.00)
tag-conversations tag ./convos/ --max-cost=5.00

# Pause processing when limit reached (allows manual review)
tag-conversations tag ./convos/ --max-cost=10.00 --on-limit=pause

# Stop processing immediately on limit (strict budget control)
tag-conversations tag ./convos/ --max-cost=15.00 --on-limit=stop

# Warn but continue processing (monitoring mode)
tag-conversations tag ./convos/ --max-cost=20.00 --on-limit=warn
```

### Real-time Cost Display

During processing, the CLI shows:

```
Tagging Progress | ████████████████████ | 100% | 25/25 files
📊 Session Summary:
├── Current cost: $3.47 of $5.00 budget (69%)
├── Estimated remaining: $1.23
├── Files processed: 25/25
└── Average cost per file: $0.139
```

## Usage Analytics

The CLI maintains detailed usage statistics:

### Historical Tracking

- Generates detailed cost and usage reports
- Identifies token usage patterns and optimization opportunities
- Tracks historical usage across runs

### Report Generation

```bash
# View detailed token usage report
tag-conversations stats --last-run

# Export usage history to CSV
tag-conversations stats --export=usage_report.csv
```

## Model Selection

The CLI provides an intelligent model selection system:

### Interactive Selection

```
Select model for tagging (arrow keys + enter):
> gpt-3.5-turbo ($0.56 estimated) - Recommended for this batch size
  gpt-4-turbo-preview ($2.14 estimated) - Higher accuracy, 4× cost
  gpt-4 ($4.28 estimated) - Legacy model, not recommended

Pro tip: Add --model=gpt-3.5-turbo to skip this prompt
```

### Model Options

- Different models can be used for different stages:

```bash
# Use different models for different processing stages
tag-conversations tag ./convos/ --summary-model=gpt-3.5-turbo --classification-model=gpt-4
```

### Quota Management

- Proactive quota checking before batch processing
- Real-time usage tracking against OpenAI rate limits
- Request rate throttling to prevent 429 errors
- Automatic session resumption after quota reset

## Cost-saving Strategies

The CLI implements several cost-saving strategies:

### Pre-processing

- Filter files that don't need processing (already tagged)
- Use embedding-based pre-classification for large batches
- Consolidate similar conversations for batch processing

### Intelligent Batching

- Group conversations by topic for context sharing
- Process similar conversations together to leverage context
- Optimize batch sizes for different models 