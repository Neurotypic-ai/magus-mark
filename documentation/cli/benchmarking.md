# CLI Benchmarking Capabilities

The Obsidian Magic CLI includes a comprehensive benchmarking system to evaluate model performance, accuracy, and cost-effectiveness across different configurations.

## Benchmark Command

The CLI provides a dedicated benchmark command for performance evaluation:

```bash
# Run basic benchmark
tag-conversations test --benchmark

# Run comprehensive benchmark with all models
tag-conversations test --benchmark --all-models

# Compare specific models
tag-conversations test --benchmark --models=gpt-3.5-turbo,gpt-4
```

## Benchmark Datasets

The benchmark system uses carefully curated test datasets:

### Built-in Datasets

The CLI includes built-in benchmark datasets:

- **Standard**: General conversation sample with diverse topics (~100 files)
- **Edge-case**: Challenging conversations with ambiguous topics
- **Multilingual**: Conversations in multiple languages
- **Technical**: Specialized technical conversations

```bash
# Run benchmark with specific dataset
tag-conversations test --benchmark --dataset=technical
```

### Custom Datasets

Users can define custom benchmark datasets:

```bash
# Register a custom benchmark dataset
tag-conversations benchmark register-dataset ./my-dataset/ --name=my-custom-dataset

# Run benchmark with custom dataset
tag-conversations test --benchmark --dataset=my-custom-dataset
```

## Benchmark Metrics

The benchmark system evaluates performance across multiple dimensions:

### Accuracy Metrics

- **Tag Precision**: Correctness of applied tags
- **Tag Recall**: Completeness of tag coverage
- **Classification F1-Score**: Combined precision and recall measure
- **Domain Accuracy**: Precision within specific domains
- **Confusion Matrix**: Detailed error analysis

### Performance Metrics

- **Tokens per Conversation**: Average token usage per conversation
- **Processing Time**: Time required for different operations
- **Cost per Conversation**: Average cost per processed file
- **Cost per Tag**: Efficiency of tag generation
- **Throughput**: Files processed per minute

### Reliability Metrics

- **Error Rate**: Frequency of processing failures
- **Retry Rate**: Frequency of API retries
- **Completion Rate**: Percentage of successfully processed files
- **Consistency**: Variance in classification results

## Benchmark Reports

The CLI generates comprehensive reports from benchmark runs:

### Report Formats

```bash
# Generate HTML benchmark report
tag-conversations test --benchmark --report=html --output=benchmark-report.html

# Generate JSON data for further analysis
tag-conversations test --benchmark --report=json --output=benchmark-data.json

# Generate CSV for spreadsheet analysis
tag-conversations test --benchmark --report=csv --output=benchmark-results.csv
```

### Report Contents

- Executive summary with key findings
- Detailed performance breakdowns by model
- Cost analysis and comparisons
- Accuracy metrics with visualization
- Improvement recommendations
- Raw data for further analysis

## Model Comparison

The benchmark system enables detailed model comparison:

### Comparison Features

- Side-by-side model performance comparison
- Cost-benefit analysis for different models
- Performance/cost ratios
- Optimal model recommendations by task type
- Detailed error analysis by model

```bash
# Compare specific models and generate comparison report
tag-conversations test --benchmark --models=gpt-3.5-turbo,gpt-4,claude-3-opus --compare --output=model-comparison.html
```

## Parameter Optimization

The benchmark system can optimize processing parameters:

### Optimization Features

- Systematic testing of different parameter combinations
- Confidence threshold optimization
- Concurrency parameter tuning
- Token optimization strategy evaluation
- Automatic identification of optimal configuration

```bash
# Run parameter optimization benchmark
tag-conversations test --benchmark --optimize-params --parameters=confidence,concurrency
```

## Continuous Benchmarking

The CLI supports automated regular benchmarking:

### Automation Options

```bash
# Schedule regular benchmark runs
tag-conversations benchmark schedule --frequency=weekly --dataset=standard --models=gpt-3.5-turbo,gpt-4

# View benchmark history
tag-conversations benchmark history

# Compare benchmark runs
tag-conversations benchmark compare --runs=latest,previous
```

## Custom Benchmark Scenarios

Create specialized benchmark scenarios for specific needs:

### Scenario Configuration

```bash
# Create custom benchmark scenario
tag-conversations benchmark create-scenario tagging-technical-content \
  --dataset=technical \
  --models=gpt-3.5-turbo,gpt-4 \
  --params=max-tokens:1000,temperature:0.2

# Run custom benchmark scenario
tag-conversations benchmark run-scenario tagging-technical-content
```

## Integration Testing

The benchmark system includes integration testing capabilities:

### Integration Tests

- End-to-end workflow testing
- API integration validation
- Error handling verification
- Performance regression testing
- Configuration validation

```bash
# Run integration tests
tag-conversations test --integration

# Run specific integration test suite
tag-conversations test --integration --suite=api-handling
```

## Stress Testing

The CLI includes tools for stress testing the system:

### Stress Test Features

- Large volume processing simulation
- Parallel processing stress testing
- API quota limit testing
- Error recovery validation
- System resource monitoring

```bash
# Run stress test
tag-conversations test --stress-test --volume=1000 --concurrency=10

# Run targeted stress test
tag-conversations test --stress-test --focus=api-resilience
```

## Performance Analysis Tools

The CLI provides tools for detailed performance analysis:

### Analysis Features

- Token usage breakdown by conversation type
- Cost attribution by classification stage
- Processing time distribution analysis
- Memory usage profiling
- Bottleneck identification

```bash
# Generate performance analysis report
tag-conversations benchmark analyze-performance --last-run --output=performance-analysis.html
```

## Data Visualization

The benchmark reports include rich data visualization:

### Visualization Types

- Performance comparison charts
- Cost distribution graphs
- Accuracy heatmaps
- Processing time histograms
- Tag distribution visualizations

The visualizations help identify patterns and make data-driven decisions about model selection and configuration optimization. 