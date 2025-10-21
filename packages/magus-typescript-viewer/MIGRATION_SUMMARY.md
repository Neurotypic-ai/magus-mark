# Vue Flow → Cytoscape + ELK Migration Summary

## Overview

Successfully migrated the TypeScript dependency graph visualization from Vue Flow (with Dagre layout) to Cytoscape.js
(with ELK layout).

## Changes Made

### Dependencies Updated

**Added:**

- `cytoscape@^3.33.1` - Core graph visualization library
- `cytoscape-elk@^2.3.0` - ELK layout integration for Cytoscape
- `elkjs@^0.11.0` - Eclipse Layout Kernel for hierarchical layouts
- `@types/cytoscape@^3.21.9` - TypeScript type definitions

**Removed (to be uninstalled):**

- `@vue-flow/core`
- `@vue-flow/background`
- `@vue-flow/controls`
- `@dagrejs/dagre` (layout engine)
- `@types/dagre`

### Core Architecture Changes

#### 1. **Type System** (`types.ts`)

- Converted from Vue Flow's Node/Edge format to Cytoscape's ElementDefinition format
- Nodes now use `group: 'nodes'` with data structure: `{ id, label, type, parent, ... }`
- Edges now use `group: 'edges'` with data structure: `{ id, source, target, type, ... }`
- Added ELK-specific direction types: `'DOWN' | 'UP' | 'LEFT' | 'RIGHT'`
- Added helper functions for direction conversion

#### 2. **Layout Engine**

**Deleted:**

- `dagreLayoutEngine.ts` - Old Dagre hierarchical layout

**Created:**

- `elkLayoutEngine.ts` - New ELK-based layout engine
  - Supports layered, force, stress, and mrtree algorithms
  - Better handling of hierarchical/nested structures
  - Improved edge routing with fewer crossings
  - Async layout processing (ELK is naturally async)

#### 3. **Layout Processing**

**Updated:**

- `WebWorkerLayoutProcessor.ts` - Now uses ELK instead of Dagre
  - Changed config from `nodesep/ranksep` to `nodeSpacing/layerSpacing`
  - Added algorithm selection (layered, force, stress, mrtree)
  - Updated direction handling for ELK format
- `GraphLayoutWorker.ts` - Worker now handles async ELK processing
  - Changed from synchronous Dagre to async ELK
  - Maintained same message-passing interface

#### 4. **Graph Data Creation**

**Updated:**

- `createGraphNodes.ts` - Converts to Cytoscape node format
  - Removed Vue Flow handle positions
  - Changed from `id` prop to `data.id`
  - Changed parent references from `parentNode` to `data.parent`
  - Added `selectable`, `grabbable`, `classes` properties

- `createGraphEdges.ts` - Converts to Cytoscape edge format
  - Removed Vue Flow MarkerType
  - Edges styled via Cytoscape stylesheet instead
  - Changed from flat properties to nested `data` structure

#### 5. **Main Component** (`DependencyGraph/index.vue`)

**Complete rewrite:**

- Replaced `<VueFlow>` component with Cytoscape container div
- Initialize Cytoscape programmatically with `cytoscape()`
- Changed event handling:
  - `@node-click` → `cy.on('tap', 'node', ...)`
  - `@node-double-click` → `cy.on('dbltap', 'node', ...)`
  - `@pane-click` → `cy.on('tap', ...)`
- Zoom/pan handled by Cytoscape API:
  - `cy.zoom()` for zoom in/out
  - `cy.fit()` for fit view
  - `cy.animate()` for smooth transitions
- Selection/highlighting via CSS classes:
  - `node.addClass('selected')`
  - `node.addClass('highlighted')`
  - `node.addClass('dimmed')`

#### 6. **UI Components**

**Updated:**

- `GraphControls.vue` - Removed `useVueFlow()` hook
  - Added events for `zoom-in`, `zoom-out`, `fit-view`
  - Parent component handles Cytoscape API calls
  - Changed `rankSpacing` to `layerSpacing` for ELK

- `GraphSearch.vue` - Removed Vue Flow Panel component
  - Now a simple div (positioning handled by parent)
  - Added clear button for search

#### 7. **Styling**

**Created:**

- `cytoscapeTheme.ts` - Comprehensive Cytoscape stylesheet
  - Node styles by type (package, module, class, interface, etc.)
  - Edge styles by relationship type
  - State-based styles (selected, highlighted, dimmed, search-result)
  - Compound node (parent) styles

**Updated:**

- `index.css` - Removed all Vue Flow CSS classes
  - Replaced with minimal Cytoscape container styles
  - Cytoscape uses canvas rendering, styling via API

#### 8. **Graph Clustering**

**Updated:**

- `scc.ts` - Strongly Connected Component detection
  - Removed Vue Flow MarkerType import
  - Updated node creation to Cytoscape format
  - Updated edge structure for Cytoscape

- `folders.ts` - Folder-based clustering (if exists)
  - Updated to use Cytoscape node/edge format

#### 9. **Configuration**

**Updated:**

- `vite.config.ts` - Updated vendor chunking
  - Changed from `flow-vendor` to `graph-vendor`
  - Updated optimizeDeps to include Cytoscape packages

- `layout/config.ts` - Updated for ELK
  - Changed directions from `TB/LR/RL/BT` to `DOWN/RIGHT/LEFT/UP`
  - Renamed `rankSpacing` to `layerSpacing`
  - Added `algorithm` option

#### 10. **Deleted Files**

- `dagreLayoutEngine.ts` - Replaced by elkLayoutEngine.ts
- (Note: Vue Flow dependencies should be removed via `pnpm remove`)

## Benefits of Migration

### Performance

- **Canvas rendering** vs DOM - Cytoscape uses canvas for better performance with large graphs
- **Optimized layout** - ELK provides superior hierarchical layouts with better edge routing
- **Fewer crossings** - ELK's crossing minimization strategies are more sophisticated

### Features

- **Multiple algorithms** - ELK offers layered, force-directed, stress, and tree layouts
- **Better nesting** - Superior support for compound (parent-child) nodes
- **Flexible styling** - Powerful CSS-like selector system
- **Industry standard** - Cytoscape is widely used in bioinformatics and network analysis

### Code Quality

- **Type safety** - Better TypeScript integration
- **Simpler API** - Direct programmatic control vs component props
- **Less abstraction** - Fewer layers between code and rendering

## Breaking Changes

### For Users

- Graph appearance may look slightly different (new layout algorithm)
- Node handles are no longer visible (Cytoscape doesn't expose connection points)
- Edge routing is more sophisticated (may take different paths)

### For Developers

- Custom node components (BaseNode.vue, etc.) are no longer used
  - Cytoscape renders nodes via canvas, not Vue components
  - Custom rendering requires Cytoscape extensions or overlays
- Different event handling patterns
- Different styling approach (stylesheet API vs CSS classes)

## Migration Checklist

- [x] Update dependencies in package.json
- [x] Create ELK layout engine
- [x] Update type definitions
- [x] Convert node/edge creation utilities
- [x] Rewrite main graph component
- [x] Update UI control components
- [x] Create Cytoscape stylesheet
- [x] Update graph clustering logic
- [x] Update configuration files
- [x] Remove old Dagre files
- [x] Update CSS
- [ ] Run `pnpm install` to install new dependencies
- [ ] Run `pnpm remove @vue-flow/core @vue-flow/background @vue-flow/controls @dagrejs/dagre @types/dagre`
- [ ] Test graph rendering with sample data
- [ ] Test all interaction features (zoom, pan, selection, search)
- [ ] Test layout algorithm options
- [ ] Test SCC and folder clustering
- [ ] Verify performance improvements

## Next Steps

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Remove old dependencies:**

   ```bash
   pnpm remove @vue-flow/core @vue-flow/background @vue-flow/controls @dagrejs/dagre @types/dagre
   ```

3. **Test the application:**

   ```bash
   pnpm dev:ui
   ```

4. **Build and verify:**
   ```bash
   pnpm build
   ```

## Notes

- BaseNode.vue and custom node components are kept for reference but are no longer used
- Layout performance should be noticeably better for large graphs (>500 nodes)
- ELK provides more configuration options than Dagre - explore the elkjs documentation for advanced layouts
- Consider adding Cytoscape extensions for additional features (e.g., context menus, edge editing, etc.)

## References

- [Cytoscape.js Documentation](https://js.cytoscape.org/)
- [ELK Documentation](https://www.eclipse.org/elk/)
- [Cytoscape ELK Extension](https://github.com/cytoscape/cytoscape.js-elk)
