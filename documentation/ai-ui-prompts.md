# Obsidian Magic: AI UI Prompts & Screens

This document collects all AI design prompts and UI screen/component ideas for both the VS Code and Obsidian plugins,
including implemented, planned, and aspirational features. For each UI, detailed prompts are provided for GPT-4o, Figma,
and Excalidraw. All prompts are scenario-rich, LLM-optimized, and include accessibility, neurodiversity, extensibility,
and delight requirements.

---

## 1. Visual Studio Code Extension UI Screens

### Tag Explorer (Tree View)

- **Description:** Hierarchical navigation and management of tag taxonomy in the VS Code sidebar.
- **Prompts:**
  - **GPT-4o:** Design a Tag Explorer for a VS Code extension that enables users to browse, search, and manage a
    hierarchical tag taxonomy (domains, subdomains, tags) in a collapsible tree. Support drag-and-drop reordering with
    animated feedback and undo/redo, inline editing, color-coding by tag type, and real-time usage stats. Include
    context menus for advanced actions (merge, split, refactor, audit history), keyboard navigation, screen reader
    support, and high-contrast mode. Provide neurodiversity overlays (focus mode, reduced motion, dyslexia-friendly
    fonts), onboarding tooltips, and a "tag health" meter. Handle edge cases: empty state, 10,000+ tags, conflicting
    edits from multiple users. Allow extensibility via plugin hooks for custom tag actions and export/import of tag
    trees. Ensure graceful error handling and recovery. (Speculation) Imagine a "tag time machine" to visualize taxonomy
    evolution over time, and collaborative editing with user avatars.
  - **Figma:** Wireframe a VS Code sidebar Tag Explorer with collapsible tree nodes, drag handles, color-coded badges,
    inline edit fields, context menu overlays, and animated transitions. Annotate accessibility overlays for keyboard
    focus, screen reader labels, and colorblind-safe palettes. Include neurodiversity toggle for font/spacing/motion
    presets, onboarding tooltips, and a "tag health" meter. Show mobile and desktop breakpoints, and annotate all
    interactive elements, error/empty states, and developer handoff notes. (Speculation) Add a timeline slider for
    taxonomy history and user avatars for collaborative editing.
  - **Excalidraw:** Draw a VS Code sidebar with a tag tree: nested nodes, drag handles, context menu icons, and a "tag
    health" meter. Overlay user avatars for collaborative editing, a timeline slider for taxonomy history, and callouts
    for empty/error states and power-user shortcuts. (Speculation) Add AI-suggested tag clusters and a "focus mode"
    overlay.

### Vault Browser

- **Description:** Browse and manage Obsidian vault files directly within VS Code.
- **Prompts:**
  - **GPT-4o:** Design a file browser panel for a VS Code extension that displays the structure of an Obsidian vault,
    supports file/folder operations, and integrates tag indicators and quick actions. Users should be able to filter by
    tag, preview file metadata, and perform batch operations. Ensure keyboard accessibility, screen reader support, and
    responsive layout. Handle edge cases: deeply nested folders, large vaults, and permission errors. (Speculation) Add
    real-time sync indicators, collaborative editing presence, and AI-powered file recommendations.
  - **Figma:** Wireframe a VS Code explorer panel showing folders/files, tag badges, context menus, batch action
    controls, and real-time sync indicators. Annotate accessibility overlays, onboarding tooltips, and error/empty
    states. (Speculation) Add a sidebar for AI file recommendations and collaborative user presence.
  - **Excalidraw:** Draw a VS Code file explorer with tag icons, right-click menu overlay, sync status indicators, and a
    collaborative editing sidebar. (Speculation) Add AI file suggestions and a "recent activity" feed.

### Tag Dashboard (WebView)

- **Description:** Analytics and insights about the tag ecosystem, including tag usage, coverage, and trends.
- **Prompts:**
  - **GPT-4o:** Design a dashboard for a VS Code extension that visualizes tag usage statistics, coverage, trends, and
    API cost. Include interactive charts, tables, tag clouds, and filter controls. Support drill-down into tag details,
    export of analytics, and real-time updates. Ensure accessibility (WCAG 2.1 AA), neurodiversity-friendly color
    schemes, and responsive layout. Handle edge cases: no data, API errors, and large datasets. (Speculation) Add
    predictive analytics, anomaly detection, and a "tag health forecast."
  - **Figma:** Create a dashboard layout with bar/line charts, tag clouds, summary cards, filter controls, and export
    buttons. Annotate accessibility overlays, neurodiversity color presets, and onboarding tooltips. (Speculation) Add a
    predictive analytics widget and anomaly alerts.
  - **Excalidraw:** Sketch a dashboard with multiple chart widgets, a tag cloud, filter dropdowns, and a "health
    forecast" panel. (Speculation) Add a predictive trend line and anomaly callouts.

### AI Assistant Panel

- **Description:** Dedicated interface for AI-powered tag suggestions, explanations, and batch actions.
- **Prompts:**
  - **GPT-4o:** Design an AI assistant panel for a VS Code extension that displays tag suggestions, explanations,
    confidence scores, and batch approval/rejection controls. Include a chat-like interface for user queries, onboarding
    walkthrough, and feedback mechanism. Ensure accessibility, neurodiversity overlays, and error handling for failed
    suggestions. (Speculation) Add a "what-if" simulation mode and AI learning feedback loop.
  - **Figma:** Wireframe a VS Code panel with a chat area, suggestion cards, confidence bars, explanation tooltips,
    batch action buttons, and onboarding walkthrough. Annotate accessibility overlays and error/empty states.
    (Speculation) Add a "simulation" toggle and feedback widget.
  - **Excalidraw:** Draw a VS Code panel with chat, suggestion cards, batch action controls, and a "simulation" overlay.
    (Speculation) Add a feedback loop icon and "AI learning" indicator.

### Knowledge Graph (WebView)

- **Description:** Interactive visualization of tag relationships and document connections.
- **Prompts:**
  - **GPT-4o:** Design an interactive knowledge graph for a VS Code extension, showing tags and documents as nodes, with
    edges for relationships. Support zoom, pan, filter, node details on click, and export as image/SVG. Ensure keyboard
    navigation, screen reader support, and colorblind-safe palettes. Handle edge cases: dense graphs, disconnected
    nodes, and performance with large datasets. (Speculation) Add time-travel playback, collaborative editing, and
    AI-suggested clusters.
  - **Figma:** Create a graph visualization with draggable nodes, color-coded edges, filter controls, export button, and
    accessibility overlays. Annotate onboarding tooltips, error/empty states, and performance warnings. (Speculation)
    Add a timeline slider and collaborative user avatars.
  - **Excalidraw:** Sketch a force-directed graph with nodes, edges, zoom controls, sidebar for node details, and a
    timeline slider. (Speculation) Add collaborative cursors and AI cluster highlights.

### Tag Editing/Refactoring Tools

- **Description:** Tools for renaming, merging, splitting, and refactoring tags across files.
- **Prompts:**
  - **GPT-4o:** Design a tag refactoring tool for VS Code that allows users to rename, merge, split, and refactor tags
    across multiple files, with preview, undo/redo, and batch action support. Include search/filter, conflict
    resolution, and audit history. Ensure accessibility, neurodiversity overlays, and error handling for failed
    operations. (Speculation) Add AI-powered refactor suggestions and "what-if" previews.
  - **Figma:** Wireframe a modal/dialog for tag refactoring with search, preview, batch action controls, conflict
    resolution, and audit history. Annotate accessibility overlays, onboarding tooltips, and error/empty states.
    (Speculation) Add an AI suggestion panel and "what-if" preview toggle.
  - **Excalidraw:** Draw a VS Code modal with tag lists, merge/split buttons, preview pane, and an AI suggestion
    sidebar. (Speculation) Add a "what-if" preview overlay and conflict callouts.

### Tag-Aware Markdown Preview

- **Description:** Enhanced markdown preview with tag highlighting, navigation, and inline actions.
- **Prompts:**
  - **GPT-4o:** Design a markdown preview for VS Code that highlights tags, provides navigation to tag definitions, and
    supports inline tag actions (edit, add, remove). Include accessibility overlays, neurodiversity-friendly color
    schemes, and onboarding tooltips. Handle edge cases: invalid tags, large files, and missing metadata. (Speculation)
    Add AI-powered tag suggestions and a "focus mode."
  - **Figma:** Create a markdown preview panel with colored tag highlights, action buttons, accessibility overlays, and
    onboarding tooltips. (Speculation) Add an AI suggestion bar and "focus mode" toggle.
  - **Excalidraw:** Sketch a markdown preview with highlighted tags, inline action icons, and an AI suggestion overlay.
    (Speculation) Add a "focus mode" background and error callouts.

### Status Bar & Notifications

- **Description:** Real-time indicators for tag processing, API usage, and quick actions.
- **Prompts:**
  - **GPT-4o:** Design status bar items and notification toasts for a VS Code extension, showing tag processing status,
    API usage, and quick access to tag management. Ensure accessibility, neurodiversity overlays, and error/empty state
    handling. (Speculation) Add a "celebration" animation for milestones and a "panic button" for error recovery.
  - **Figma:** Wireframe status bar indicators, notification popups, accessibility overlays, and celebration/panic
    icons. (Speculation) Add a milestone animation and error recovery button.
  - **Excalidraw:** Draw a VS Code status bar with tag icons, notification popup, celebration confetti, and a panic
    button. (Speculation) Add an error state overlay and milestone badge.

### Settings & Configuration UI

- **Description:** User and workspace settings editor for tag, AI, and sync preferences.
- **Prompts:**
  - **GPT-4o:** Design a settings editor for a VS Code extension, allowing users to configure tag, AI, and sync
    preferences. Include validation, tooltips, accessibility overlays, neurodiversity presets, onboarding, and error
    handling. (Speculation) Add a "settings history" timeline and AI-powered recommendations.
  - **Figma:** Create a settings panel with grouped options, toggles, help tooltips, accessibility overlays, and
    onboarding. (Speculation) Add a history timeline and AI recommendation widget.
  - **Excalidraw:** Sketch a settings dialog with tabs, toggles, info icons, a history slider, and an AI recommendation
    area.

---

## 2. Obsidian Plugin UI Screens

### Tag Management View

- **Description:** Central workspace for managing, searching, editing, and batch processing tags in the vault.
- **Prompts:**
  - **GPT-4o:** Design a tag management workspace for an Obsidian plugin, with searchable tag lists, batch operations,
    statistics, and tag editing. Support drag-and-drop, keyboard shortcuts, accessibility overlays, neurodiversity
    presets, onboarding, and error handling. Handle edge cases: empty vault, conflicting edits, and large tag sets.
    (Speculation) Add collaborative editing, AI-powered tag health, and a "tag evolution" timeline.
  - **Figma:** Wireframe a tag management panel with search, tag list, batch action buttons, stats widgets,
    accessibility overlays, and onboarding tooltips. (Speculation) Add a collaboration sidebar, tag health meter, and
    timeline slider.
  - **Excalidraw:** Draw a workspace with tag list, search bar, batch action area, stats section, collaboration avatars,
    and a timeline slider. (Speculation) Add a tag health overlay and AI suggestion callouts.

### Tag Visualization View

- **Description:** Interactive graph or canvas visualization of tag relationships, usage, and clusters.
- **Prompts:**
  - **GPT-4o:** Design a tag visualization view for an Obsidian plugin, showing tags as nodes in a force-directed graph,
    with zoom, filter, drag-to-reposition, color coding, accessibility overlays, neurodiversity presets, onboarding, and
    error handling. Handle edge cases: dense graphs, disconnected nodes, and performance with large datasets.
    (Speculation) Add time-travel playback, collaborative editing, and AI-suggested clusters.
  - **Figma:** Create a graph/canvas visualization with draggable nodes, color-coded edges, filter controls, export
    button, accessibility overlays, and onboarding tooltips. (Speculation) Add a timeline slider, collaboration avatars,
    and AI cluster highlights.
  - **Excalidraw:** Sketch a canvas with tag nodes, edges, zoom slider, filter input, timeline slider, collaboration
    cursors, and AI cluster highlights. (Speculation) Add a "focus mode" overlay and error callouts.

### Folder Tag Modal

- **Description:** Modal dialog for tagging folders and batch applying tags to contained files.
- **Prompts:**
  - **GPT-4o:** Design a modal for batch tagging folders in an Obsidian plugin, with folder selection, tag input,
    preview of affected files, confirmation step, accessibility overlays, neurodiversity presets, onboarding, and error
    handling. Handle edge cases: large folders, permission errors, and conflicting tags. (Speculation) Add AI-powered
    tag suggestions and a "preview impact" simulation.
  - **Figma:** Wireframe a modal with folder tree, tag input, preview list, confirm/cancel buttons, accessibility
    overlays, and onboarding tooltips. (Speculation) Add an AI suggestion bar and impact simulation toggle.
  - **Excalidraw:** Draw a modal dialog with folder tree, tag input field, preview area, AI suggestion bar, and impact
    simulation overlay. (Speculation) Add error callouts and a "batch undo" button.

### Tag Suggestions Panel

- **Description:** Panel for reviewing and applying AI-generated tag suggestions with confidence scores and
  explanations.
- **Prompts:**
  - **GPT-4o:** Design a tag suggestions panel for an Obsidian plugin, listing AI-generated tags, confidence scores,
    explanations, batch approval/rejection controls, accessibility overlays, neurodiversity presets, onboarding, and
    error handling. Handle edge cases: no suggestions, conflicting tags, and low confidence. (Speculation) Add a
    "feedback to AI" loop and a "suggestion history" timeline.
  - **Figma:** Create a panel with suggestion cards, confidence bars, explanation tooltips, batch action buttons,
    accessibility overlays, and onboarding tooltips. (Speculation) Add a feedback widget and suggestion history slider.
  - **Excalidraw:** Sketch a panel with suggestion list, confidence bars, approve/reject buttons, feedback widget, and
    history slider. (Speculation) Add error callouts and a "confidence filter" toggle.

### Tag Relationship Graph

- **Description:** Force-directed graph of tag relationships, with interactive exploration and export options.
- **Prompts:**
  - **GPT-4o:** Design a tag relationship graph for an Obsidian plugin, with interactive nodes, filtering, export as
    image/SVG, accessibility overlays, neurodiversity presets, onboarding, and error handling. Handle edge cases: dense
    graphs, disconnected nodes, and performance with large datasets. (Speculation) Add a timeline slider, collaborative
    editing, and AI-suggested clusters.
  - **Figma:** Create a force-directed graph with node/edge controls, export button, accessibility overlays, and
    onboarding tooltips. (Speculation) Add a timeline slider, collaboration avatars, and AI cluster highlights.
  - **Excalidraw:** Draw a graph with nodes, edges, filter controls, export icon, timeline slider, collaboration
    cursors, and AI cluster highlights. (Speculation) Add error callouts and a "focus mode" overlay.

### Tag Usage Analytics

- **Description:** Analytics dashboard for tag usage, frequency, trends, and content distribution.
- **Prompts:**
  - **GPT-4o:** Design a tag usage analytics dashboard for an Obsidian plugin, with heat maps, frequency charts, trend
    lines, content distribution by tag, accessibility overlays, neurodiversity presets, onboarding, and error handling.
    Handle edge cases: no data, API errors, and large datasets. (Speculation) Add predictive analytics, anomaly
    detection, and a "tag health forecast."
  - **Figma:** Wireframe a dashboard with heat map, bar charts, trend lines, analytics widgets, accessibility overlays,
    and onboarding tooltips. (Speculation) Add a predictive analytics widget and anomaly alerts.
  - **Excalidraw:** Sketch a dashboard with analytics widgets, filter controls, predictive trend line, and anomaly
    callouts. (Speculation) Add a "health forecast" panel and error overlays.

### Document Clustering View

- **Description:** Visual clustering of documents by tag similarity and topic modeling.
- **Prompts:**
  - **GPT-4o:** Design a document clustering view for an Obsidian plugin, showing clusters of documents by tag
    similarity, with topic modeling overlays, outlier detection, accessibility overlays, neurodiversity presets,
    onboarding, and error handling. Handle edge cases: sparse clusters, ambiguous topics, and large datasets.
    (Speculation) Add AI-powered topic suggestions and a "cluster evolution" timeline.
  - **Figma:** Create a clustering visualization with document nodes, cluster boundaries, topic labels, accessibility
    overlays, and onboarding tooltips. (Speculation) Add a topic suggestion bar and cluster evolution slider.
  - **Excalidraw:** Draw a cluster map with document nodes, cluster outlines, topic tags, topic suggestion bar, and
    evolution slider. (Speculation) Add error callouts and a "focus mode" overlay.

### Conflict Resolution Interface

- **Description:** UI for detecting, visualizing, and resolving tag conflicts across files.
- **Prompts:**
  - **GPT-4o:** Design a conflict resolution interface for an Obsidian plugin, showing conflicting tags, confidence
    comparisons, visual diffs, batch resolution actions, accessibility overlays, neurodiversity presets, onboarding, and
    error handling. Handle edge cases: many conflicts, ambiguous resolutions, and user fatigue. (Speculation) Add
    AI-powered resolution suggestions and a "conflict history" timeline.
  - **Figma:** Wireframe a conflict resolution panel with diff views, confidence bars, batch action buttons,
    accessibility overlays, and onboarding tooltips. (Speculation) Add an AI suggestion panel and conflict history
    slider.
  - **Excalidraw:** Sketch a panel with conflict lists, diff highlights, resolution controls, AI suggestion panel, and
    history slider. (Speculation) Add error callouts and a "batch undo" button.

### Tag Editing & Bulk Operations

- **Description:** Tools for direct tag editing, batch operations, and version control of tag changes.
- **Prompts:**
  - **GPT-4o:** Design a tag editing and bulk operations interface for an Obsidian plugin, supporting multi-select,
    find/replace, tag propagation, merging, splitting, version history, accessibility overlays, neurodiversity presets,
    onboarding, and error handling. Handle edge cases: large batches, conflicting edits, and undo/redo. (Speculation)
    Add AI-powered bulk suggestions and a "history playback" feature.
  - **Figma:** Create a bulk operations panel with tag lists, action buttons, history viewer, accessibility overlays,
    and onboarding tooltips. (Speculation) Add an AI suggestion bar and history playback slider.
  - **Excalidraw:** Draw a panel with tag lists, batch action icons, timeline/history area, AI suggestion bar, and
    playback slider. (Speculation) Add error callouts and a "focus mode" overlay.

### Natural Language Query Panel

- **Description:** Panel for querying content and tags using natural language, with smart filters and query history.
- **Prompts:**
  - **GPT-4o:** Design a natural language query panel for an Obsidian plugin, allowing users to ask questions about
    their content/tags, with smart filters, query history, favorites, accessibility overlays, neurodiversity presets,
    onboarding, and error handling. Handle edge cases: ambiguous queries, no results, and large histories. (Speculation)
    Add AI-powered query suggestions and a "query evolution" timeline.
  - **Figma:** Wireframe a query panel with input box, filter chips, history list, accessibility overlays, and
    onboarding tooltips. (Speculation) Add a query suggestion bar and evolution slider.
  - **Excalidraw:** Sketch a panel with query input, filter chips, history sidebar, query suggestion bar, and evolution
    slider. (Speculation) Add error callouts and a "focus mode" overlay.

### Advanced Search & Semantic Search

- **Description:** Combined content and tag search with boolean, semantic, and saved search templates.
- **Prompts:**
  - **GPT-4o:** Design an advanced search interface for an Obsidian plugin, supporting boolean, semantic, and saved
    search templates, result visualization, accessibility overlays, neurodiversity presets, onboarding, and error
    handling. Handle edge cases: complex queries, no results, and large result sets. (Speculation) Add AI-powered search
    suggestions and a "search history" timeline.
  - **Figma:** Create a search panel with boolean/semantic toggles, result list, save template button, accessibility
    overlays, and onboarding tooltips. (Speculation) Add a search suggestion bar and history slider.
  - **Excalidraw:** Draw a search panel with toggles, result list, template icons, search suggestion bar, and history
    slider. (Speculation) Add error callouts and a "focus mode" overlay.

---

## 3. Cross-Platform & Aspirational UI Screens

### Real-Time Collaboration Panel

- **Description:** UI for real-time collaborative tag editing and conflict resolution.
- **Prompts:**
  - **GPT-4o:** Design a real-time collaboration panel for tag editing, showing user cursors, live changes, conflict
    resolution tools, chat, activity feed, accessibility overlays, neurodiversity presets, onboarding, and error
    handling. Handle edge cases: merge conflicts, network lag, and user fatigue. (Speculation) Add AI-powered conflict
    prediction and a "collaboration timeline."
  - **Figma:** Wireframe a collaboration panel with user avatars, live edit indicators, chat area, activity log,
    accessibility overlays, and onboarding tooltips. (Speculation) Add a conflict prediction widget and collaboration
    timeline slider.
  - **Excalidraw:** Sketch a panel with user cursors, chat bubbles, conflict highlights, conflict prediction widget, and
    timeline slider. (Speculation) Add error callouts and a "focus mode" overlay.

### Accessibility & Neurodiversity Settings

- **Description:** Deep accessibility and neurodiversity customization panel for all UI.
- **Prompts:**
  - **GPT-4o:** Design an accessibility and neurodiversity settings panel, allowing users to customize color schemes,
    motion, font, focus modes, presets for common neurotypes, preview, onboarding, and error handling. Ensure WCAG 2.1
    AA compliance and neurodiversity best practices. (Speculation) Add AI-powered accessibility recommendations and a
    "preset sharing" feature.
  - **Figma:** Create a settings panel with color pickers, motion toggles, font selectors, preview area, accessibility
    overlays, and onboarding tooltips. (Speculation) Add a recommendation widget and preset sharing button.
  - **Excalidraw:** Draw a settings panel with color/motion/font controls, preview box, recommendation widget, and
    sharing button. (Speculation) Add error callouts and a "focus mode" overlay.

### Plugin Marketplace & Extension Gallery

- **Description:** Marketplace UI for discovering, installing, and managing custom taggers and extensions.
- **Prompts:**
  - **GPT-4o:** Design a plugin marketplace for taggers/extensions, with search, ratings, install/update controls,
    compatibility filters, accessibility overlays, neurodiversity presets, onboarding, and error handling. Handle edge
    cases: incompatible plugins, failed installs, and large catalogs. (Speculation) Add AI-powered plugin
    recommendations and a "marketplace history" timeline.
  - **Figma:** Wireframe a marketplace grid with plugin cards, search bar, filter sidebar, accessibility overlays, and
    onboarding tooltips. (Speculation) Add a recommendation widget and history slider.
  - **Excalidraw:** Sketch a marketplace with plugin cards, search/filter controls, install buttons, recommendation
    widget, and history slider. (Speculation) Add error callouts and a "focus mode" overlay.

### AI Prompt & Instruction Editor

- **Description:** Editor for creating, managing, and sharing AI prompts and custom instructions.
- **Prompts:**
  - **GPT-4o:** Design an AI prompt/instruction editor, supporting markdown, reusable prompt files, sharing, versioning,
    preview, test run features, accessibility overlays, neurodiversity presets, onboarding, and error handling. Handle
    edge cases: invalid prompts, version conflicts, and sharing errors. (Speculation) Add AI-powered prompt suggestions
    and a "prompt history" timeline.
  - **Figma:** Create an editor panel with markdown input, preview pane, share/version controls, accessibility overlays,
    and onboarding tooltips. (Speculation) Add a suggestion bar and history slider.
  - **Excalidraw:** Draw an editor with markdown area, preview, share/version buttons, suggestion bar, and history
    slider. (Speculation) Add error callouts and a "focus mode" overlay.

### Tag Policy & Governance Dashboard

- **Description:** Dashboard for managing tag policies, validation rules, and audit logs.
- **Prompts:**
  - **GPT-4o:** Design a tag policy and governance dashboard, showing policy rules, validation results, audit logs,
    policy templates, accessibility overlays, neurodiversity presets, onboarding, and error handling. Handle edge cases:
    conflicting policies, failed validations, and large audit logs. (Speculation) Add AI-powered policy suggestions and
    a "policy history" timeline.
  - **Figma:** Wireframe a dashboard with policy list, validation results, audit log table, accessibility overlays, and
    onboarding tooltips. (Speculation) Add a suggestion widget and history slider.
  - **Excalidraw:** Sketch a dashboard with policy cards, validation icons, log table, suggestion widget, and history
    slider. (Speculation) Add error callouts and a "focus mode" overlay.

### Mobile-Optimized Tag Management

- **Description:** Touch-optimized UI for tag management and analytics on mobile devices.
- **Prompts:**
  - **GPT-4o:** Design a mobile-optimized tag management interface, with large touch targets, swipe actions, responsive
    analytics, accessibility overlays, neurodiversity presets, onboarding, and error handling. Handle edge cases: small
    screens, offline mode, and sync conflicts. (Speculation) Add AI-powered mobile suggestions and a "mobile history"
    timeline.
  - **Figma:** Create a mobile UI with tag lists, swipeable actions, analytics cards, accessibility overlays, and
    onboarding tooltips. (Speculation) Add a suggestion bar and history slider.
  - **Excalidraw:** Draw a mobile screen with tag list, swipe icons, analytics widgets, suggestion bar, and history
    slider. (Speculation) Add error callouts and a "focus mode" overlay.

### Calendar & Timeline Tag Visualization

- **Description:** Calendar and timeline views for visualizing tag usage and trends over time.
- **Prompts:**
  - **GPT-4o:** Design a calendar and timeline visualization for tag usage, showing daily/weekly/monthly trends, tag
    overlays, event highlights, accessibility overlays, neurodiversity presets, onboarding, and error handling. Handle
    edge cases: missing data, overlapping events, and large timelines. (Speculation) Add AI-powered trend predictions
    and a "timeline history" slider.
  - **Figma:** Wireframe a calendar/timeline with tag overlays, trend lines, event dots, accessibility overlays, and
    onboarding tooltips. (Speculation) Add a prediction widget and history slider.
  - **Excalidraw:** Sketch a calendar/timeline with tag color overlays, trend lines, prediction widget, and history
    slider. (Speculation) Add error callouts and a "focus mode" overlay.

### Kanban & Outliner Tag Integration

- **Description:** Kanban and outliner views with tag-based organization, filtering, and analytics.
- **Prompts:**
  - **GPT-4o:** Design Kanban and outliner views with tag-based lanes, card coloring, filtering, tag analytics,
    accessibility overlays, neurodiversity presets, onboarding, and error handling. Handle edge cases: large boards,
    conflicting tags, and undo/redo. (Speculation) Add AI-powered lane suggestions and a "board history" timeline.
  - **Figma:** Create Kanban/outliner boards with tag filters, colored cards, analytics panels, accessibility overlays,
    and onboarding tooltips. (Speculation) Add a suggestion bar and history slider.
  - **Excalidraw:** Draw Kanban/outliner boards with tag icons, filter chips, analytics widgets, suggestion bar, and
    history slider. (Speculation) Add error callouts and a "focus mode" overlay.

### Excalidraw Tag Integration

- **Description:** Tag-based organization and filtering for Excalidraw drawings.
- **Prompts:**
  - **GPT-4o:** Design an Excalidraw integration for tag-based drawing organization, filtering, search, overlays, batch
    actions, accessibility overlays, neurodiversity presets, onboarding, and error handling. Handle edge cases: large
    drawings, conflicting tags, and undo/redo. (Speculation) Add AI-powered tag overlays and a "drawing history"
    timeline.
  - **Figma:** Wireframe an Excalidraw sidebar with tag filters, search, overlay controls, accessibility overlays, and
    onboarding tooltips. (Speculation) Add a tag overlay widget and history slider.
  - **Excalidraw:** Sketch an Excalidraw canvas with tag filter sidebar, overlay icons, tag overlay widget, and history
    slider. (Speculation) Add error callouts and a "focus mode" overlay.

---

_This list is intentionally exhaustive, speculative, and LLM-optimized. Additions and refinements are welcome as the
project evolves._
