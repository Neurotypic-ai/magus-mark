# 3D View Data Display Fix

## Problem

The 3D dependency graph view was showing 0 nodes and 0 links because it was reading from the Pinia graph store, which
was only populated by the 2D `DependencyGraph` component. When in 3D mode, the 2D component skips initialization (lines
506-509), leaving the store empty.

## Root Cause

**Data Flow Issue:**

1. `App.vue` fetches data into `graphData` (a `DependencyPackageGraph`)
2. `App.vue` passes this to `DependencyGraph` component via props
3. `DependencyGraph` (2D view) has conditional logic that skips initialization when `viewMode === '3d'`
4. `DependencyGraph3D` (3D view) was reading from the shared Pinia store (`nodes` and `edges`)
5. Since the store was never populated in 3D mode, the 3D view had no data to display

## Solution

Made the `DependencyGraph3D` component self-sufficient by having it create nodes and edges directly from the `data` prop
instead of relying on the Pinia store.

### Key Changes to `/packages/magus-typescript-viewer/src/client/components/DependencyGraph3D/index.vue`

1. **Added Direct Data Transformation:**
   - Imported `createGraphNodes()` and `createGraphEdges()` utility functions
   - Created computed properties that transform the `data` prop directly
   - Removed dependency on store for node/edge data (store still used for selected node state)

2. **Computed Properties for Nodes:**

   ```typescript
   const nodes = computed<DependencyNode[]>(() => {
     if (!props.data || !props.data.packages || props.data.packages.size === 0) {
       return [];
     }

     return createGraphNodes(props.data, {
       showPackages: graphSettings.showPackages,
       showModules: graphSettings.showModules,
       showClasses: graphSettings.showClasses,
       showInterfaces: graphSettings.showInterfaces,
       showTypes: graphSettings.showTypes,
       showEnums: graphSettings.showEnums,
       showFunctions: graphSettings.showFunctions,
     });
   });
   ```

3. **Computed Properties for Edges:**

   ```typescript
   const edges = computed<GraphEdge[]>(() => {
     if (!props.data || nodes.value.length === 0) {
       return [];
     }

     const allEdges = createGraphEdges(props.data);

     // Filter edges to only include those connecting visible nodes
     const visibleNodeIds = new Set(nodes.value.map((node) => node.id));
     const enabledTypes = new Set(graphSettings.enabledRelationshipTypes);

     return allEdges.filter((edge) => {
       const edgeType = edge.data?.type ?? 'dependency';
       const bothNodesVisible = visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
       const typeEnabled = enabledTypes.has(edgeType);
       return bothNodesVisible && typeEnabled;
     });
   });
   ```

4. **Reactive Visibility Settings:**
   - Added watcher for visibility settings changes
   - Computed properties automatically recompute when settings change
   - 3D graph updates automatically via existing data change watchers

## Benefits

1. **Independence:** 3D view no longer depends on 2D view's initialization
2. **Consistency:** Both views now work independently with the same data source
3. **Reactivity:** 3D view automatically updates when visibility settings change
4. **Simplicity:** Clearer data flow - each view is responsible for its own data transformation

## Testing

Build completed successfully with no linter errors. The 3D view should now:

- Display nodes and edges from the data prop
- Respect visibility settings (show/hide packages, modules, classes, etc.)
- Filter edges based on enabled relationship types
- Update automatically when settings change
- Initialize only when both nodes AND edges are ready

## Bug Fixes

### Build 2: Fixed Watcher Destructuring Error
**Issue:** `can't access property Symbol.iterator, (destructured parameter) is undefined`

**Cause:** The watcher was trying to destructure old values `[oldNodeCount, oldEdgeCount]` on the first run with `immediate: true`, but Vue doesn't provide old values on the first watch callback.

**Fix:** Removed the unused old value destructuring from the watch callback. The callback now only receives and destructures the new values `[nodeCount, edgeCount]`.

## Next Steps

To verify the fix:

1. Start the TypeScript viewer dev server
2. Switch to 3D view mode
3. Confirm that nodes and edges are now visible
4. Test visibility toggles to ensure they work in 3D mode
5. Verify edge filtering works correctly
