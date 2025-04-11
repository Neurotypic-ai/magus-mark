# Core Tagging Model & Taxonomy

This document describes the fundamental tagging model and classification strategy used by Obsidian Magic.

## Hierarchical Tagging System

The system implements a sophisticated AI-powered tagging framework with the following structure:

### Year Tag

- Strictly 4-digit years (e.g., `2023`, `2024`), automatically extracted from conversation metadata or content
- The system uses date entity recognition to identify the most relevant temporal context
- If multiple years are mentioned, the AI selects the dominant year based on frequency and context

### Life Area Tag

A curated taxonomy of life domains, including:

- `career`
- `relationships`
- `health`
- `learning`
- `projects`
- `personal-growth`
- `finance`
- `hobby`

The AI identifies the primary life area through contextual analysis, even when not explicitly mentioned.

### Topical Tags

A three-tier hierarchical classification system:

1. **Primary Domain**: Selected from a maintained taxonomy of knowledge domains
   - Example domains: `software-development`, `philosophy`, `design`, `psychology`, etc.

2. **Subdomain**: More specific categorization within the primary domain
   - Example: If domain is `software-development`, subdomains include `frontend`, `backend`, `devops`

3. **Contextual Tag**: A flexible "wildcard" tag that can be either:
   - Another domain/subdomain if the conversation crosses domains
   - A special tag from a curated "wildcard list" of cross-domain concepts
   - A newly proposed tag if none of the existing tags adequately capture an important dimension

### Conversation Type Tag

Precisely one conversational modality from:

- `theory` - Abstract or conceptual discussions
- `practical` - Implementation-focused or action-oriented
- `meta` - Self-referential or about the process itself
- `casual` - Informal, exploratory conversations
- `adhd-thought` - Non-linear, associative thinking patterns
- `deep-dive` - Comprehensive exploration of a topic
- `exploration` - Initial investigation of new concepts
- `experimental` - Testing ideas or hypotheses
- `reflection` - Contemplative assessment
- `planning` - Forward-looking organization
- `question` - Inquiry-driven exchange
- `analysis` - Detailed examination of specifics

## Taxonomy Governance

This taxonomy is extensible by design, with clear governance for adding new categories:

- Domain/subdomain pairs can be extended through a review process
- Wildcard tags grow organically based on system usage
- Core categories (year and conversation type) remain relatively fixed

## Classification Strategy

The system employs a sophisticated multi-stage classification approach:

### Domain/Subdomain Classification

- The AI strictly adheres to the official taxonomy for primary domains and subdomains
- Uses embedding similarity and semantic matching to map conversation topics to the most relevant domain/subdomain pairs
- When no clear match exists, the system maps to the closest parent category rather than creating new categories
- Confidence scores are calculated for each tag assignment

### Controlled Vocabulary Expansion

- Only the third "contextual" tag allows for organic growth with new suggestions
- When suggesting a new contextual tag, the AI provides a confidence score and rationale
- New tags are logged for periodic review and potential inclusion in the official taxonomy
- A feedback loop between tag usage patterns and taxonomy updates ensures the system evolves with user needs

### Multi-label Classification Approach

- Each conversation is guaranteed to have a year tag and conversation type tag
- Life area tags are applied when the confidence score exceeds a configurable threshold
- Topical tags follow a strict precedence rule: domain → subdomain → contextual
- Tag assignments use a weighted voting system combining embedding similarity, keyword frequency, and contextual relevance

This creates a balance between classification consistency and the ability to capture novel concepts as they emerge.

## Tag Management & Inference

The system implements a context-aware tag management strategy:

### Dynamic Tag Allocation

- Each conversation is analyzed for topical relevance using advanced NLP techniques
- The system applies between 0-3 topical tags, depending on content relevance
- Multi-topic conversations receive hierarchically structured tags (domain → subdomain → contextual)
- Tag application follows the principle of "quality over quantity" - no tags are better than incorrect tags

### Handling Tag Sparsity

- Year and conversation type are mandatory and will always be inferred, even if not explicit
- Life area tags are applied only when the content clearly relates to a specific life domain
- If a conversation lacks clear topical focus, the system will apply fewer tags rather than forcing potentially irrelevant categorization
- Confidence thresholds determine when tags should be applied vs. omitted

### Tag Consistency Management

- By default, the system overwrites existing tags to maintain consistency across conversations
- Configurable behavior allows for:
  - **Overwrite mode**: Replace all existing tags (default)
  - **Merge mode**: Keep existing tags that don't conflict with new classifications
  - **Augment mode**: Only add tags for empty categories
- The system maintains a version history of tag changes for audit and rollback purposes

This approach ensures precise, contextually appropriate tagging while accommodating varying levels of topic specificity. 