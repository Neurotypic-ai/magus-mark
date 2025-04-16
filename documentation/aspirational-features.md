# Obsidian Magic: Aspirational, In-Progress, and Implemented Features

## Table of Contents

- [UI/UX Features](#uiux-features)
- [CLI Features](#cli-features)
- [VS Code Integration](#vs-code-integration)
- [Build System & Nx](#build-system--nx)
- [Tagging Model](#tagging-model)
- [Testing & Benchmarking](#testing--benchmarking)
- [MCP/VS Code/Cursor Integration FAQ](#mcpvscodecursor-integration-faq)
- [Other Aspirational Ideas](#other-aspirational-ideas)

---

## UI/UX Features

### Implemented

- Minimal, accessible UI for tag editing and review
- Keyboard navigation and basic focus management

### In Progress

- Vault file reading in VS Code plugin
- Confidence indicators for tag assignments

### Aspirational

- Drag-and-drop tag organization
- Graph visualization of tag relationships
- Color-coded tags by category
- Interactive tag chips (click, shift+click, context menu)
- Hover tooltips with metadata and quick actions
- Contextual sidebar with suggestions
- Natural language tag filtering
- Advanced accessibility for neurodivergent users (motion control, color schemes, etc.)
- Closed captions and audio controls for any media
- Responsive design for all screen sizes

---

## CLI Features

### Implemented

- `obsidian-magic` as the root command
- Commands: `tag`, `test` (benchmark), `config`, `stats`, `taxonomy`
- Yargs-based argument parsing
- Progress indicators and error handling

### In Progress

- Interactive tag editing in CLI
- Cost management and token estimation

### Aspirational

- Priority-based queue with session persistence
- Checkpoint recovery for long runs
- Multi-bar progress visualization
- Model comparison and benchmarking suites
- Rich data display and statistics
- Customizable keyboard controls

---

## VS Code Integration

### Implemented

- MCP server for AI tool registration
- Vault file reading
- Status bar integration

### In Progress

- Migration of tests from Vitest to Mocha
- Enhanced tool registration and error handling

### Aspirational

- Bidirectional vault sync
- AI-assisted knowledge retrieval
- Graph-based tag visualization in VS Code
- Deep integration with Cursor AI workflows

---

## Build System & Nx

### Implemented

- Nx workspace with inferred targets
- Project tags and implicit dependencies
- Custom generators for apps and libraries
- TypeScript project references
- Centralized config for lint, test, build

### In Progress

- Locking down module boundaries
- Expanding Nx plugin/addon usage

### Aspirational

- Automated enforcement of boundaries and tags
- Workspace generators for new features/components
- Visual dependency graph tooling
- Full CI/CD integration with Nx Cloud

---

## Tagging Model

### Implemented

- Hierarchical taxonomy (domains, subdomains, life areas, conversation types)
- Tag format: `#2023`, `#ai`, etc.
- Type-safe tag definitions

### In Progress

- Confidence scoring for tag assignments
- Configurable tag consistency modes (overwrite, merge, augment)

### Aspirational

- Real-time validation and suggestions
- Drag-and-drop tag reordering
- Version history and audit for tag changes
- Graph-based tag relationship explorer

---

## Testing & Benchmarking

### Implemented

- Vitest for most packages
- Mocha for VS Code integration tests
- CLI `test` command as benchmark

### In Progress

- Migration of all VS Code tests to Mocha
- Simplified mocks and test utilities

### Aspirational

- End-to-end tests with Playwright (future reintroduction)
- Dedicated testing package
- Automated coverage and performance reporting

---

## MCP/VS Code/Cursor Integration FAQ

**Q: How does the MCP server work?** A: The MCP server (via `@magus-mcp` Go tool) helps install and configure
`magus-mcp.json` and `mcp.json` for easy integration with Cursor and VS Code. It enables tool registration and
AI-powered workflows.

**Q: How do I troubleshoot Cursor/VS Code/MCP issues?** A: See the [Cursor Forums](https://forum.cursor.com/) for
up-to-date troubleshooting. Common issues include port conflicts, configuration mismatches, and version drift. Always
check your `mcp.json` and ensure the MCP server is running.

**Q: Can the VS Code plugin read vault files directly?** A: Yes, this is implemented and in use.

**Q: What if my MCP server isn't detected?** A: Restart VS Code, check your `mcp.json`, and verify the MCP server is
running on the expected port.

---

## Other Aspirational Ideas (Speculation)

- AI-powered tag suggestion explanations
- User-driven taxonomy editing with audit trail
- Plugin marketplace for custom taggers
- Real-time collaboration on tag editing
- Integration with other LLM providers (Anthropic, Google, etc.)
- Automated changelog and release note generation
- Accessibility-first design system
