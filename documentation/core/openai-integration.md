# OpenAI Integration & Prompt Engineering

This document describes the OpenAI integration and prompt engineering techniques used for accurate classification with minimal token usage.

## Context-Optimized Prompting

The system employs OpenAI's recommended prompt engineering practices to maximize classification accuracy while minimizing token usage:

### Intelligent Context Selection

- Rather than passing entire conversations, the system uses an embedding-based extractive approach to identify the most relevant segments
- For long conversations, a two-stage process is used:
  1. First pass: Generate an embedding-based summary focusing on topical indicators
  2. Second pass: Submit the summary plus key excerpts for detailed tagging
- Conversations under a configurable token threshold are processed in their entirety

### Structured Prompt Design

- Clear task delineation with explicit instructions and formatting expectations
- System message establishes the role: "You are a precise conversation classifier specialized in identifying topics, conversation types, and contextual metadata."
- Clearly delimited sections using markdown separators to distinguish instructions, reference data, and content
- Example:

```
<conversation>
[Extracted conversation content]
</conversation>

<instructions>
Analyze the conversation above and classify it according to the taxonomies below.
</instructions>
```

### Chain-of-Thought Reasoning

- Instructs the model to "think step-by-step" before final tag assignment
- Utilizes OpenAI's recommended approach of breaking complex tasks into subtasks:
  1. First identify the general topic and temporal context
  2. Then map to specific domains and subdomains
  3. Finally determine conversation type and life area
- Confidence scoring for each tag to enable threshold-based filtering

### Reference Knowledge

- Includes the complete taxonomy inline for exact matching
- Provides clear examples of correct classification for different conversation types
- Uses "few-shot" learning with 2-3 examples to guide the model's understanding

## Precision-Oriented Prompting Style

The system uses a precisely engineered prompting style optimized for classification accuracy:

### Directive Clarity

- Formal, specific instructions with explicit constraints
- Clear step-by-step guidance on the classification process
- Unambiguous criteria for tag selection
- Example:
  ```
  You must classify this conversation using ONLY the approved tags listed below.
  For domain/subdomain pairs, select exactly from the provided taxonomy.
  For the contextual tag, either select from the approved list or, ONLY if none apply,
  suggest a single new tag with justification.
  ```

### Structured Response Format

- Explicit JSON output template with required fields
- Example response format provided inline
- Clear instruction to follow the exact output structure:
  ```
  Provide your classification as a valid JSON object with the following structure:
  {
    "year": "YYYY",
    "life_area": "area_name",
    "topical_tags": [
      {"domain": "domain_name", "subdomain": "subdomain_name"},
      {"contextual": "contextual_tag"}
    ],
    "conversation_type": "type_name",
    "confidence": {
      "overall": 0.95,
      "life_area": 0.87,
      "domain": 0.92,
      "conversation_type": 0.94
    }
  }
  ```

### Error Prevention Mechanisms

- Explicit instructions to prevent hallucination of non-existent tags
- Clear guidance on handling uncertainty ("If you're unsure about a tag, set confidence below 0.7")
- Specific instructions for handling edge cases

## Quality Assurance Framework

The system implements a sophisticated quality assurance approach with multiple review options:

### Confidence-Based Workflow

- Each tag assignment includes a confidence score from 0.0 to 1.0
- Tags with confidence above configurable thresholds (default: 0.85) are auto-applied
- Tags with confidence in a "review zone" (default: 0.65-0.85) are flagged for optional human review
- Tags with confidence below the minimum threshold (default: 0.65) are rejected or replaced with broader categories

### Selective Explanation Generation

- For high-confidence tags (>0.85), no explanation is provided to minimize token usage
- For medium-confidence tags (0.65-0.85), a brief rationale is generated
- For new contextual tag suggestions, a detailed justification is always provided
- Example:
  ```json
  {
    "tags": {
      /* tag structure */
    },
    "confidence": {
      /* confidence scores */
    },
    "explanations": {
      "domain": "Selected 'software-development' based on discussion of programming techniques and code examples",
      "contextual_tag": "Suggested new tag 'state-management' because the conversation focuses on Redux, MobX, and similar approaches not covered by existing tags"
    }
  }
  ```

### Review Interface Integration

- System generates a summary view of all tag assignments with confidence indicators
- Quick approval workflow for batch acceptance of high-confidence tags
- Detailed review interface for uncertain classifications
- Tag editing capabilities with taxonomy validation

## Large File Processing

### Chunking Strategy

- Process large conversations in meaningful semantic chunks (e.g., by conversation turns or topics)
- Use a recursive summarization approach where chunks are processed independently, then results are combined
- Set configurable maximum chunk sizes (e.g., 4K, 8K, 16K tokens depending on model)

### Context Window Optimization

- Implement token counting using tiktoken library for accurate token estimation
- For very large files, extract the most relevant sections using embedding similarity
- Use a sliding window approach for documents that exceed token limits

## API Performance Optimization

### Rate Limit Handling

- Implement industry-standard exponential backoff with random jitter
- Start with small delays (1-2s) that double with each retry attempt
- Set configurable maximum retry attempts and maximum backoff time (e.g., 60s)

### Request Optimization

- Implement token rate tracking to stay below API quotas
- Use client-side request batching and queuing for optimal throughput
- Support concurrent processing with configurable concurrency limits

### Fallback Strategy

- If GPT-4 requests fail due to rate limits, fall back to GPT-3.5-Turbo
- Allow specifying different models for different stages of processing
- Implement circuit breaker pattern to prevent overwhelming the API during outages 