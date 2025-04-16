# Obsidian Magic: Innovation, Questions, and Findings

## Philosophy: Why Obsidian Magic is Built for Plain Text, Git, and Portability

Obsidian Magic is designed around a simple but powerful philosophy: your knowledge should remain portable, future-proof,
and under your control. By leveraging markdown files and plain text, every change you make is inherently compatible with
the entire ecosystem of git-based tools. Obsidian vaults are just folders of text files—no proprietary formats, no
lock-in, and no hidden data.

**Version Control by Default:**

- Every change to your notes, tags, or taxonomy is a plain text edit. This means you can use git (or any version control
  system) to track, review, and manage your knowledge base.
- Obsidian Sync is fundamentally a git repository under the hood, and there are popular git plugins for Obsidian that
  make versioning seamless. Even without plugins, you can manage your vault with standard git commands or any GUI
  client.
- Because everything is text, you can use the full suite of diff tools, merge tools, and extensions—no custom code
  required.

**Open Source, Portable, and Future-Proof:**

- The choice of Obsidian and markdown ensures your data is always accessible, editable, and transferable. As long as
  ASCII and plain text exist, your knowledge base will remain readable and manageable.
- This approach means you are never locked into a single tool or vendor. You can migrate, fork, or share your vault with
  anyone, anywhere, using open standards.

**Why This Matters:**

- You gain the power of the open source ecosystem: automation, collaboration, and integration with thousands of tools.
- Your knowledge base is resilient to platform changes, app shutdowns, or proprietary lock-in.
- Obsidian Magic is built to enhance—not replace—these strengths, letting you focus on organizing and understanding your
  knowledge, not fighting your tools.

---

## Implementation Plan

### 1. Automation-First, Large-Scale Tagging Pipeline

- **Goal:** Process large quantities of documents (including future OCR/PDF-to-markdown flows) and power downstream AI
  tools.
- **Checklist:**
  - [ ] CLI/Batch tool to process entire folders of markdown files
  - [ ] Accept folder path as input
  - [ ] Recursively find all markdown files
  - [ ] Respect ignore patterns (e.g., .gitignore, .obsidian)
  - [ ] Context-aware batching
  - [ ] Calculate OpenAI context window size
  - [ ] Group files into batches that fit within context limits
  - [ ] Store batch progress in per-vault SQLite DB
  - [ ] Resumable pipeline
  - [ ] On start, check DB for incomplete batches
  - [ ] Resume from last checkpoint
  - [ ] On error, log and skip/retry/halt based on user preference
  - [ ] Error handling
  - [ ] Log all errors to global log file
  - [ ] CLI flag: `--on-error=skip|retry|halt`
  - [ ] Output formats
  - [ ] Write results as JSON, CSV, Markdown summary, and logs
  - [ ] CLI flag: `--output-format=json|csv|md|all`
  - [ ] Tag application mode
  - [ ] Overwrite/append/merge preference (configurable)
  - [ ] Example YAML frontmatter update:
    ```yaml
    ---
    tags: [math, algebra, quadratics]
    ---
    ```
  - [ ] (Future) PDF-to-markdown conversion
  - [ ] (Future) Pluggable pipeline for custom pre/post-processing

### 2. Visible, Structured Metadata & Tag Visualization

- **Goal:** Tags are always visible in markdown and automatically visualized/organized with other tools.
- **Checklist:**
  - [ ] Write tags as YAML frontmatter in markdown
  - [ ] Parse and update YAML using `js-yaml` or similar
  - [ ] Use Obsidian's built-in tag cloud/view
  - [ ] No custom visualization initially
  - [ ] (Future) Enhance built-in view for Domain > Topic > Subtopic grouping

### 3. User-Customizable, AI-Suggested Taxonomy (with Fixed Structure)

- **Goal:** Users can hide/add tags, but the structure (Domain > Topic > Subtopic) is fixed. AI can suggest new tags,
  but not auto-create them.
- **Checklist:**
  - [ ] Taxonomy manager UI
  - [ ] Tree view with drag-and-drop, filtering, sorting
  - [ ] Store user customizations in settings file
  - [ ] Cache DB for intermediate state
  - [ ] Main taxonomy embedded in plugin
  - [ ] Approval interface
  - [ ] Show summary of document, tag, confidence
  - [ ] Approve/reject individually or in batch
  - [ ] "Suggested tags" inbox
  - [ ] List all AI-suggested tags pending approval
  - [ ] Editor view for taxonomy validation/review
  - [ ] Highlight invalid/missing tags
  - [ ] Allow user to fix or approve

### 4. Team-Ready, Vault-Based Collaboration (Not Real-Time)

- **Goal:** Multiple users can share a vault and collaborate on tagging, but not in real time.
- **Checklist:**
  - [ ] Store all taxonomy/tag changes in vault (YAML/markdown)
  - [ ] Rely on git/Obsidian Sync for audit, change review, and merge conflicts
  - [ ] No in-app notifications

### 5. On-Demand Tag Explanations & AI Confidence Management

- **Goal:** Tag explanations and AI confidence are only shown on demand or below a confidence threshold.
- **Checklist:**
  - [ ] Table view for tag explanations/confidence
  - [ ] Show tag, explanation, confidence, approve/reject controls
  - [ ] User-configurable confidence threshold
  - [ ] Batch actions: select all, shift-select, command/control-click
  - [ ] Approve/reject all options

### 6. Neurodiversity-First UI Customization

- **Goal:** Deep customization for focus, color, motion, and reading patterns—beyond WCAG.
- **Checklist:**
  - [ ] Conform to Obsidian/VSCode preferences (font, color, spacing, animation)
  - [ ] Auto-update UI on theme change (if supported)
  - [ ] Support "reset to default" and export/import for settings
  - [ ] All settings in app's settings panel

### 7. Vault/Tag Health Dashboard

- **Goal:** Visualize tag coverage, orphaned notes, taxonomy drift, and more.
- **Checklist:**
  - [ ] Dashboard/approval screen
  - [ ] Show total tags, total API cost, remaining cost, (optional) processing time
  - [ ] No drill-down/export initially
  - [ ] Reports interface for error/edge case reporting

### 8. Taxonomy Governance & Validation

- **Goal:** Fixed lists, validation, and consensus to prevent drift. Auto-approve above threshold, interface for
  approval below.
- **Checklist:**
  - [ ] Validate all tag assignments against current taxonomy
  - [ ] If tag missing, AI suggests alternatives or requests user input
  - [ ] Auto-approve above threshold, UI for below-threshold
  - [ ] Audit log of taxonomy changes (git)
  - [ ] YAML schema published as JSON Schema and TypeScript type
  - [ ] Example TypeScript type:
    ```ts
    interface Tag {
      name: string;
      domain: string;
      topic: string;
      subtopic?: string;
    }
    ```
  - [ ] Validator checks for duplicate/empty/reserved tags
  - [ ] Auto-hide invalid tags; editor view for review

### 9. Git/Obsidian Sync for Cross-Platform Collaboration

- **Goal:** All data and changes are stored in the vault and sync via git or Obsidian Sync.
- **Checklist:**
  - [ ] Store all tag/taxonomy data as markdown/YAML in vault
  - [ ] No custom sync/integration; rely on git/Obsidian Sync
  - [ ] If vault is read-only/network drive, disable tagging options

### 10. Performance, Scalability, and Resource Limits

- **Goal:** Efficient, scalable processing for large vaults and API usage.
- **Checklist:**
  - [ ] No maximum vault size
  - [ ] Parallel, automatic batching to OpenAI; bulk batched requests
  - [ ] Resource usage limiter (not user-configurable)
  - [ ] Cache results for repeated runs; allow user to clear cache
  - [ ] Warn if API usage/cost projected to exceed threshold
  - [ ] Exponential/fibonacci backoff for rate limits/errors
  - [ ] CLI supports "test mode" for benchmarking

### 11. Documentation & Onboarding for Junior Developers

- **Goal:** Make the project easy to contribute to and maintain.
- **Checklist:**
  - [ ] Markdown developer docs with checklists and code examples
  - [ ] Usage examples for every major function/class
  - [ ] "Quickstart" script/CLI for new contributors
  - [ ] Require code linting/formatting before commit

### 1. Automation-First, Large-Scale Tagging Pipeline

- [ ] CLI/Batch tool to process entire folders of markdown files
  - [ ] Accept folder path as input
  - [ ] Recursively find all markdown files
  - [ ] Respect ignore patterns (e.g., .gitignore, .obsidian)
- [ ] Context-aware batching
  - [ ] Calculate OpenAI context window size
  - [ ] Group files into batches that fit within context limits
  - [ ] Store batch progress in per-vault SQLite DB
    - [ ] Example: `db.run('INSERT INTO batches ...')`
- [ ] Resumable pipeline
  - [ ] On start, check DB for incomplete batches
  - [ ] Resume from last checkpoint
  - [ ] On error, log and skip/retry/halt based on user preference
- [ ] Error handling
  - [ ] Log all errors to global log file
  - [ ] CLI flag: `--on-error=skip|retry|halt`
  - [ ] Example:
    ```ts
    try { processFile(f) } catch (e) { if (onError === 'skip') continue; ... }
    ```
- [ ] Output formats
  - [ ] Write results as JSON, CSV, Markdown summary, and logs
  - [ ] CLI flag: `--output-format=json|csv|md|all`
- [ ] Tag application mode
  - [ ] Overwrite/append/merge preference (configurable)
  - [ ] Example YAML frontmatter update:
    ```yaml
    ---
    tags: [math, algebra, quadratics]
    ---
    ```
- [ ] (Future) PDF-to-markdown conversion
- [ ] (Future) Pluggable pipeline for custom pre/post-processing

### 2. Visible, Structured Metadata & Tag Visualization

- [ ] Write tags as YAML frontmatter in markdown
  - [ ] Parse and update YAML using `js-yaml` or similar
- [ ] Use Obsidian's built-in tag cloud/view
  - [ ] No custom visualization initially
- [ ] (Future) Enhance built-in view for Domain > Topic > Subtopic grouping

### 3. User-Customizable, AI-Suggested Taxonomy (with Fixed Structure)

- [ ] Taxonomy manager UI
  - [ ] Tree view with drag-and-drop, filtering, sorting
  - [ ] Store user customizations in settings file
  - [ ] Cache DB for intermediate state
  - [ ] Main taxonomy embedded in plugin
- [ ] Approval interface
  - [ ] Show summary of document, tag, confidence
  - [ ] Approve/reject individually or in batch
- [ ] "Suggested tags" inbox
  - [ ] List all AI-suggested tags pending approval
- [ ] Editor view for taxonomy validation/review
  - [ ] Highlight invalid/missing tags
  - [ ] Allow user to fix or approve

### 4. Team-Ready, Vault-Based Collaboration (Not Real-Time)

- [ ] Store all taxonomy/tag changes in vault (YAML/markdown)
- [ ] Rely on git/Obsidian Sync for audit, change review, and merge conflicts
- [ ] No in-app notifications

### 5. On-Demand Tag Explanations & AI Confidence Management

- [ ] Table view for tag explanations/confidence
  - [ ] Show tag, explanation, confidence, approve/reject controls
  - [ ] User-configurable confidence threshold
  - [ ] Batch actions: select all, shift-select, command/control-click
  - [ ] Approve/reject all options

### 6. Neurodiversity-First UI Customization

- [ ] Conform to Obsidian/VSCode preferences (font, color, spacing, animation)
- [ ] Auto-update UI on theme change (if supported)
- [ ] Support "reset to default" and export/import for settings
- [ ] All settings in app's settings panel

### 7. Vault/Tag Health Dashboard

- [ ] Dashboard/approval screen
  - [ ] Show total tags, total API cost, remaining cost, (optional) processing time
  - [ ] No drill-down/export initially
  - [ ] Reports interface for error/edge case reporting

### 8. Taxonomy Governance & Validation

- [ ] Validate all tag assignments against current taxonomy
- [ ] If tag missing, AI suggests alternatives or requests user input
- [ ] Auto-approve above threshold, UI for below-threshold
- [ ] Audit log of taxonomy changes (git)
- [ ] YAML schema published as JSON Schema and TypeScript type
  - [ ] Example TypeScript type:
    ```ts
    interface Tag {
      name: string;
      domain: string;
      topic: string;
      subtopic?: string;
    }
    ```
- [ ] Validator checks for duplicate/empty/reserved tags
- [ ] Auto-hide invalid tags; editor view for review

### 9. Git/Obsidian Sync for Cross-Platform Collaboration

- [ ] Store all tag/taxonomy data as markdown/YAML in vault
- [ ] No custom sync/integration; rely on git/Obsidian Sync
- [ ] If vault is read-only/network drive, disable tagging options

### 10. Performance, Scalability, and Resource Limits

- [ ] No maximum vault size
- [ ] Parallel, automatic batching to OpenAI; bulk batched requests
- [ ] Resource usage limiter (not user-configurable)
- [ ] Cache results for repeated runs; allow user to clear cache
- [ ] Warn if API usage/cost projected to exceed threshold
- [ ] Exponential/fibonacci backoff for rate limits/errors
- [ ] CLI supports "test mode" for benchmarking

### 11. Documentation & Onboarding for Junior Developers

- [ ] Markdown developer docs with checklists and code examples
- [ ] Usage examples for every major function/class
- [ ] "Quickstart" script/CLI for new contributors
- [ ] Require code linting/formatting before commit

### Proposed AI Prompts for GPT-4o (for Figma or Mermaid.js)

**Prompt Template:**

> "Design a [UI component] for an Obsidian/VSCode plugin. The component should support [features]. Use a modern,
> accessible style. Output as [Figma wireframe description|Mermaid.js diagram|HTML/CSS mockup]."

**Examples:**

- Taxonomy Manager:
  > "Design a tree view UI for taxonomy management in an Obsidian plugin. It should support drag-and-drop, filtering,
  > and sorting. Show how users can add, remove, and move tags. Output as a Figma wireframe description."
- Approval Interface:
  > "Design a table view for reviewing AI-suggested tags in an Obsidian plugin. Each row shows a tag, explanation,
  > confidence score, and approve/reject controls. Include batch actions (select all, approve all, reject all). Output
  > as a Figma wireframe description."
- Suggested Tags Inbox:
  > "Design a list view for pending AI-suggested tags in an Obsidian plugin. Each item shows the tag, source document,
  > and confidence. Users can approve or reject each. Output as a Figma wireframe description."
- Editor View for Taxonomy Validation:
  > "Design an editor sidebar for taxonomy validation in an Obsidian plugin. Highlight invalid or missing tags and
  > provide controls to fix or approve them. Output as a Figma wireframe description."
- Vault/Tag Health Dashboard:
  > "Design a dashboard for vault/tag health in an Obsidian plugin. Show total tags, API cost, remaining cost, and error
  > reports. Output as a Figma wireframe description."
