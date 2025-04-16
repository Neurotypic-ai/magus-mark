# Obsidian Magic: AI UI Prompts & Screens

This document collects all AI design prompts and UI screen/component ideas for both the VS Code and Obsidian plugins,
including implemented, planned, and aspirational features. For each UI, detailed prompts are provided for GPT-4o, Figma,
and Excalidraw.

---

## 1. Visual Studio Code Extension UI Screens

### Tag Explorer (Tree View)

- **Description:** Hierarchical navigation and management of tag taxonomy in the VS Code sidebar.
- **Prompts:**
  - **GPT-4o:** Design a hierarchical tag explorer for a VS Code extension. It should display domains, subdomains, and
    tags as a collapsible tree, support drag-and-drop reordering, show tag usage counts, and allow right-click actions
    (edit, delete, filter). Ensure full keyboard accessibility and high-contrast support.
  - **Figma:** Create a sidebar tree view for tag navigation in VS Code, with collapsible nodes, drag-and-drop, context
    menus, and usage badges. Include focus indicators and accessible color schemes.
  - **Excalidraw:** Sketch a VS Code sidebar with a tree structure for tags, showing nested nodes, drag handles, and
    context menu icons. Highlight selected and focused states.

### Vault Browser

- **Description:** Browse and manage Obsidian vault files directly within VS Code.
- **Prompts:**
  - **GPT-4o:** Design a file browser panel for a VS Code extension that displays the structure of an Obsidian vault,
    supports file/folder operations, and integrates tag indicators and quick actions.
  - **Figma:** Wireframe a VS Code explorer panel showing folders/files, tag badges, and context menus for file/tag
    actions.
  - **Excalidraw:** Draw a VS Code file explorer with tag icons next to files and folders, and a right-click menu
    overlay.

### Tag Dashboard (WebView)

- **Description:** Analytics and insights about the tag ecosystem, including tag usage, coverage, and trends.
- **Prompts:**
  - **GPT-4o:** Design a dashboard for a VS Code extension that visualizes tag usage statistics, coverage, trends, and
    API cost. Include charts, tables, and filter controls. Ensure accessibility and responsive layout.
  - **Figma:** Create a dashboard layout with bar/line charts, tag clouds, and summary cards for tag analytics in VS
    Code.
  - **Excalidraw:** Sketch a dashboard with multiple chart widgets, a tag cloud, and filter dropdowns in a VS Code
    panel.

### AI Assistant Panel

- **Description:** Dedicated interface for AI-powered tag suggestions, explanations, and batch actions.
- **Prompts:**
  - **GPT-4o:** Design an AI assistant panel for a VS Code extension that displays tag suggestions, explanations,
    confidence scores, and batch approval/rejection controls. Include a chat-like interface for user queries.
  - **Figma:** Wireframe a VS Code panel with a list of AI tag suggestions, confidence bars, explanation tooltips, and
    batch action buttons.
  - **Excalidraw:** Draw a VS Code panel with a chat area, suggestion cards, and batch action controls.

### Knowledge Graph (WebView)

- **Description:** Interactive visualization of tag relationships and document connections.
- **Prompts:**
  - **GPT-4o:** Design an interactive knowledge graph for a VS Code extension, showing tags and documents as nodes, with
    edges for relationships. Support zoom, pan, filter, and node details on click.
  - **Figma:** Create a graph visualization with draggable nodes, color-coded edges, and filter controls in a VS Code
    webview.
  - **Excalidraw:** Sketch a force-directed graph with nodes and edges, zoom controls, and a sidebar for node details.

### Tag Editing/Refactoring Tools

- **Description:** Tools for renaming, merging, splitting, and refactoring tags across files.
- **Prompts:**
  - **GPT-4o:** Design a tag refactoring tool for VS Code that allows users to rename, merge, split, and refactor tags
    across multiple files, with preview and undo support.
  - **Figma:** Wireframe a modal/dialog for tag refactoring with search, preview, and batch action controls.
  - **Excalidraw:** Draw a VS Code modal with tag lists, merge/split buttons, and a preview pane.

### Tag-Aware Markdown Preview

- **Description:** Enhanced markdown preview with tag highlighting, navigation, and inline actions.
- **Prompts:**
  - **GPT-4o:** Design a markdown preview for VS Code that highlights tags, provides navigation to tag definitions, and
    supports inline tag actions (edit, add, remove).
  - **Figma:** Create a markdown preview panel with colored tag highlights and action buttons.
  - **Excalidraw:** Sketch a markdown preview with highlighted tags and inline action icons.

### Status Bar & Notifications

- **Description:** Real-time indicators for tag processing, API usage, and quick actions.
- **Prompts:**
  - **GPT-4o:** Design status bar items and notification toasts for a VS Code extension, showing tag processing status,
    API usage, and quick access to tag management.
  - **Figma:** Wireframe status bar indicators and notification popups for tag-related events.
  - **Excalidraw:** Draw a VS Code status bar with tag icons and a notification popup overlay.

### Settings & Configuration UI

- **Description:** User and workspace settings editor for tag, AI, and sync preferences.
- **Prompts:**
  - **GPT-4o:** Design a settings editor for a VS Code extension, allowing users to configure tag, AI, and sync
    preferences. Include validation, tooltips, and accessibility features.
  - **Figma:** Create a settings panel with grouped options, toggles, and help tooltips.
  - **Excalidraw:** Sketch a settings dialog with tabs, toggles, and info icons.

---

## 2. Obsidian Plugin UI Screens

### Tag Management View

- **Description:** Central workspace for managing, searching, editing, and batch processing tags in the vault.
- **Prompts:**
  - **GPT-4o:** Design a tag management workspace for an Obsidian plugin, with searchable tag lists, batch operations,
    statistics, and tag editing. Support drag-and-drop, keyboard shortcuts, and accessibility.
  - **Figma:** Wireframe a tag management panel with search, tag list, batch action buttons, and stats widgets.
  - **Excalidraw:** Draw a workspace with a tag list, search bar, batch action area, and stats section.

### Tag Visualization View

- **Description:** Interactive graph or canvas visualization of tag relationships, usage, and clusters.
- **Prompts:**
  - **GPT-4o:** Design a tag visualization view for an Obsidian plugin, showing tags as nodes in a force-directed graph,
    with zoom, filter, and drag-to-reposition. Include color coding and accessibility features.
  - **Figma:** Create a graph/canvas visualization with draggable nodes, color-coded edges, and filter controls.
  - **Excalidraw:** Sketch a canvas with tag nodes, edges, zoom slider, and filter input.

### Folder Tag Modal

- **Description:** Modal dialog for tagging folders and batch applying tags to contained files.
- **Prompts:**
  - **GPT-4o:** Design a modal for batch tagging folders in an Obsidian plugin, with folder selection, tag input,
    preview of affected files, and confirmation step.
  - **Figma:** Wireframe a modal with folder tree, tag input, preview list, and confirm/cancel buttons.
  - **Excalidraw:** Draw a modal dialog with folder tree, tag input field, and preview area.

### Tag Suggestions Panel

- **Description:** Panel for reviewing and applying AI-generated tag suggestions with confidence scores and
  explanations.
- **Prompts:**
  - **GPT-4o:** Design a tag suggestions panel for an Obsidian plugin, listing AI-generated tags, confidence scores,
    explanations, and batch approval/rejection controls.
  - **Figma:** Create a panel with suggestion cards, confidence bars, explanation tooltips, and batch action buttons.
  - **Excalidraw:** Sketch a panel with suggestion list, confidence bars, and approve/reject buttons.

### Tag Relationship Graph

- **Description:** Force-directed graph of tag relationships, with interactive exploration and export options.
- **Prompts:**
  - **GPT-4o:** Design a tag relationship graph for an Obsidian plugin, with interactive nodes, filtering, export as
    image/SVG, and accessibility features.
  - **Figma:** Create a force-directed graph with node/edge controls and export button.
  - **Excalidraw:** Draw a graph with nodes, edges, filter controls, and export icon.

### Tag Usage Analytics

- **Description:** Analytics dashboard for tag usage, frequency, trends, and content distribution.
- **Prompts:**
  - **GPT-4o:** Design a tag usage analytics dashboard for an Obsidian plugin, with heat maps, frequency charts, trend
    lines, and content distribution by tag.
  - **Figma:** Wireframe a dashboard with heat map, bar charts, and trend lines.
  - **Excalidraw:** Sketch a dashboard with analytics widgets and filter controls.

### Document Clustering View

- **Description:** Visual clustering of documents by tag similarity and topic modeling.
- **Prompts:**
  - **GPT-4o:** Design a document clustering view for an Obsidian plugin, showing clusters of documents by tag
    similarity, with topic modeling overlays and outlier detection.
  - **Figma:** Create a clustering visualization with document nodes, cluster boundaries, and topic labels.
  - **Excalidraw:** Draw a cluster map with document nodes, cluster outlines, and topic tags.

### Conflict Resolution Interface

- **Description:** UI for detecting, visualizing, and resolving tag conflicts across files.
- **Prompts:**
  - **GPT-4o:** Design a conflict resolution interface for an Obsidian plugin, showing conflicting tags, confidence
    comparisons, visual diffs, and batch resolution actions.
  - **Figma:** Wireframe a conflict resolution panel with diff views, confidence bars, and batch action buttons.
  - **Excalidraw:** Sketch a panel with conflict lists, diff highlights, and resolution controls.

### Tag Editing & Bulk Operations

- **Description:** Tools for direct tag editing, batch operations, and version control of tag changes.
- **Prompts:**
  - **GPT-4o:** Design a tag editing and bulk operations interface for an Obsidian plugin, supporting multi-select,
    find/replace, tag propagation, merging, splitting, and version history.
  - **Figma:** Create a bulk operations panel with tag lists, action buttons, and history viewer.
  - **Excalidraw:** Draw a panel with tag lists, batch action icons, and a timeline/history area.

### Natural Language Query Panel

- **Description:** Panel for querying content and tags using natural language, with smart filters and query history.
- **Prompts:**
  - **GPT-4o:** Design a natural language query panel for an Obsidian plugin, allowing users to ask questions about
    their content/tags, with smart filters, query history, and favorites.
  - **Figma:** Wireframe a query panel with input box, filter chips, and history list.
  - **Excalidraw:** Sketch a panel with query input, filter chips, and a history sidebar.

### Advanced Search & Semantic Search

- **Description:** Combined content and tag search with boolean, semantic, and saved search templates.
- **Prompts:**
  - **GPT-4o:** Design an advanced search interface for an Obsidian plugin, supporting boolean, semantic, and saved
    search templates, with result visualization.
  - **Figma:** Create a search panel with boolean/semantic toggles, result list, and save template button.
  - **Excalidraw:** Draw a search panel with toggles, result list, and template icons.

---

## 3. Cross-Platform & Aspirational UI Screens

### Real-Time Collaboration Panel

- **Description:** UI for real-time collaborative tag editing and conflict resolution.
- **Prompts:**
  - **GPT-4o:** Design a real-time collaboration panel for tag editing, showing user cursors, live changes, and conflict
    resolution tools. Support chat and activity feed.
  - **Figma:** Wireframe a collaboration panel with user avatars, live edit indicators, chat area, and activity log.
  - **Excalidraw:** Sketch a panel with user cursors, chat bubbles, and conflict highlights.

### Accessibility & Neurodiversity Settings

- **Description:** Deep accessibility and neurodiversity customization panel for all UI.
- **Prompts:**
  - **GPT-4o:** Design an accessibility and neurodiversity settings panel, allowing users to customize color schemes,
    motion, font, and focus modes. Include presets for common neurotypes and preview.
  - **Figma:** Create a settings panel with color pickers, motion toggles, font selectors, and preview area.
  - **Excalidraw:** Draw a settings panel with color/motion/font controls and a preview box.

### Plugin Marketplace & Extension Gallery

- **Description:** Marketplace UI for discovering, installing, and managing custom taggers and extensions.
- **Prompts:**
  - **GPT-4o:** Design a plugin marketplace for taggers/extensions, with search, ratings, install/update controls, and
    compatibility filters.
  - **Figma:** Wireframe a marketplace grid with plugin cards, search bar, and filter sidebar.
  - **Excalidraw:** Sketch a marketplace with plugin cards, search/filter controls, and install buttons.

### AI Prompt & Instruction Editor

- **Description:** Editor for creating, managing, and sharing AI prompts and custom instructions.
- **Prompts:**
  - **GPT-4o:** Design an AI prompt/instruction editor, supporting markdown, reusable prompt files, sharing, and
    versioning. Include preview and test run features.
  - **Figma:** Create an editor panel with markdown input, preview pane, and share/version controls.
  - **Excalidraw:** Draw an editor with markdown area, preview, and share/version buttons.

### Tag Policy & Governance Dashboard

- **Description:** Dashboard for managing tag policies, validation rules, and audit logs.
- **Prompts:**
  - **GPT-4o:** Design a tag policy and governance dashboard, showing policy rules, validation results, audit logs, and
    policy templates. Support editing and export.
  - **Figma:** Wireframe a dashboard with policy list, validation results, and audit log table.
  - **Excalidraw:** Sketch a dashboard with policy cards, validation icons, and log table.

### Mobile-Optimized Tag Management

- **Description:** Touch-optimized UI for tag management and analytics on mobile devices.
- **Prompts:**
  - **GPT-4o:** Design a mobile-optimized tag management interface, with large touch targets, swipe actions, and
    responsive analytics.
  - **Figma:** Create a mobile UI with tag lists, swipeable actions, and analytics cards.
  - **Excalidraw:** Draw a mobile screen with tag list, swipe icons, and analytics widgets.

### Calendar & Timeline Tag Visualization

- **Description:** Calendar and timeline views for visualizing tag usage and trends over time.
- **Prompts:**
  - **GPT-4o:** Design a calendar and timeline visualization for tag usage, showing daily/weekly/monthly trends, tag
    overlays, and event highlights.
  - **Figma:** Wireframe a calendar/timeline with tag overlays, trend lines, and event dots.
  - **Excalidraw:** Sketch a calendar/timeline with tag color overlays and trend lines.

### Kanban & Outliner Tag Integration

- **Description:** Kanban and outliner views with tag-based organization, filtering, and analytics.
- **Prompts:**
  - **GPT-4o:** Design Kanban and outliner views with tag-based lanes, card coloring, filtering, and tag analytics.
  - **Figma:** Create Kanban/outliner boards with tag filters, colored cards, and analytics panels.
  - **Excalidraw:** Draw Kanban/outliner boards with tag icons, filter chips, and analytics widgets.

### Excalidraw Tag Integration

- **Description:** Tag-based organization and filtering for Excalidraw drawings.
- **Prompts:**
  - **GPT-4o:** Design an Excalidraw integration for tag-based drawing organization, filtering, and search. Support tag
    overlays and batch actions.
  - **Figma:** Wireframe an Excalidraw sidebar with tag filters, search, and overlay controls.
  - **Excalidraw:** Sketch an Excalidraw canvas with tag filter sidebar and overlay icons.

---

_This list is intentionally exhaustive and speculative. Additions and refinements are welcome as the project evolves._
