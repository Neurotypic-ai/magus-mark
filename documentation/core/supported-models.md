# OpenAI Models

Obsidian Magic dynamically checks your API key for available models and adapts its UI accordingly. This document
provides details about the supported models, their capabilities, pricing considerations, and how the system adapts to
your API key access level.

## Dynamic Model Discovery

Obsidian Magic checks which models your OpenAI API key has access to:

1. When configuring the application, it queries the OpenAI API's models endpoint
2. It builds a custom selection dropdown showing only models you can access
3. For each model, it displays current pricing information
4. If newer models become available, they will automatically appear in your options

## Supported Models

Obsidian Magic supports a wide range of OpenAI models:

| Model Family       | Models                                                | Best For                                       | Token Context | Pricing Range                   |
| ------------------ | ----------------------------------------------------- | ---------------------------------------------- | ------------- | ------------------------------- |
| **O3 Series**      | o3, o3-mini                                           | Cutting-edge capabilities, highest performance | 200,000       | $15-$40 per 1M input tokens     |
| **O1 Series**      | o1, o1-mini, o1-preview                               | Advanced reasoning, next-gen capabilities      | 128,000       | $25-$50 per 1M input tokens     |
| **GPT-4 Series**   | gpt-4o, gpt-4o-mini, gpt-4, gpt-4-turbo, gpt-4-vision | High-quality, complex tagging                  | 8,192-128,000 | $2.50-$30 per 1M input tokens   |
| **GPT-3.5 Series** | gpt-3.5-turbo, gpt-3.5-turbo-instruct                 | Routine tagging, high volume                   | 4,096-16,385  | $0.50-$1.50 per 1M input tokens |
| **Base Models**    | davinci-002, babbage-002                              | Specialized tasks                              | 16,384        | $0.40-$2.00 per 1M input tokens |

## Model Selection Guidance

### Automatic Recommendation

The system automatically recommends the best model based on:

1. **API Key Access**: Shows only models your key can access
2. **Task Complexity**: Suggests more powerful models for complex classification
3. **Budget Constraints**: Offers economical options for high-volume processing
4. **Fallback Chain**: If preferred model isn't available, intelligently falls back to alternatives

### Manual Selection By Category

#### O3 Models (Latest Generation)

- **o3**: Flagship model with the largest context window and advanced capabilities
- **o3-mini**: More economical version of o3 with similar capabilities

#### O1 Models (Advanced Reasoning)

- **o1**: High-performance model with exceptional reasoning capabilities
- **o1-mini**: Cost-effective version of o1
- **o1-preview**: Preview version with newest features

#### GPT-4 Models (High Quality)

- **gpt-4o**: Best balance of quality, speed, and cost for most needs
- **gpt-4o-mini**: More economical version of gpt-4o
- **gpt-4**: Original GPT-4 with high-quality output
- **gpt-4-turbo**: Improved performance with large context window
- **gpt-4-vision**: Adds image understanding capabilities

#### GPT-3.5 Models (Cost-Effective)

- **gpt-3.5-turbo**: Fast and affordable for routine tagging
- **gpt-3.5-turbo-instruct**: Instruction-optimized version

#### Base Models (Specialized)

- **davinci-002**: Legacy model for specialized tasks
- **babbage-002**: Most economical option for simple tasks

## Configuration

The system provides multiple ways to configure model selection:

### CLI Configuration with API Key Validation

```bash
# First time setup with dynamic model discovery
tag-conversations setup

# Set default model after validation
tag-conversations config set default-model gpt-4o

# Override for a specific run
tag-conversations tag ./path/to/files --model gpt-3.5-turbo
```

### Obsidian Plugin Settings

The model dropdown in settings is automatically populated with models your API key can access.

### Configuration File

In the configuration file, the system validates model availability when loading:

```json
{
  "defaultModel": "gpt-4o",
  "costLimit": 10,
  "tagMode": "merge"
}
```

## Cost Management

The system includes intelligent cost management for all models:

1. **Dynamic Pricing**: Fetches current pricing from OpenAI when available
2. **Token Estimation**: Preprocesses content to estimate token usage
3. **Model-Specific Costs**: Calculates exact costs per model for both input and output tokens
4. **Cost Limits**: Enforces budget limits tailored to model pricing
5. **Usage Analytics**: Tracks spending by model for optimization

## Performance Benchmarks

Internal benchmarks across different models (results may vary based on content):

| Model                  | Accuracy | Speed  | Cost per 100 Files |
| ---------------------- | -------- | ------ | ------------------ |
| gpt-4o                 | 95%      | Medium | $3.00              |
| gpt-4                  | 96%      | Slow   | $6.50              |
| gpt-3.5-turbo          | 88%      | Fast   | $0.15              |
| gpt-3.5-turbo-instruct | 84%      | Fast   | $0.25              |

_Note: Benchmarks based on average conversation length of 2,500 tokens_

## Additional Resources

- [OpenAI Model Documentation](https://platform.openai.com/docs/models/overview)
- [OpenAI Pricing](https://openai.com/pricing)
- [Cost Management Guide](../cli/cost-management.md)
