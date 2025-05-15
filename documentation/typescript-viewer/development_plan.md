# Magus TypeScript Viewer: Development and Enhancement Plan

This document outlines the steps to finalize and enhance the `magus-typescript-viewer`, addressing layout issues, node
connections, and overall stability.

## I. Project Setup & Core Review

1.  **Dependency Audit & Updates:**
    - [ ] Review `packages/magus-typescript-viewer/package.json`.
    - [ ] Add `elkjs` dependency for advanced graph layout.
    - [ ] Ensure `reactflow` (already `@xyflow/react`) and other critical dependencies like `@mui/material` are
          up-to-date and correctly configured.
    - [ ] Verify compatibility of all graph-related libraries.
2.  **Configuration Review:**
    - [ ] Check `vite.config.ts` for any build or proxy issues affecting the dev server or API communication.
    - [ ] Review `tsconfig.json` for optimal TypeScript settings for this package.

## II. Data Flow & Integrity (Client-Side)

1.  **`GraphDataAssembler.ts` Refactor (`src/client/assemblers/`):**
    - [ ] **Goal:** Ensure accurate transformation of server data into client-side graph structures.
    - [ ] Modify `transformPropertyCollection` to return `NodeProperty[]` instead of
          `Record<string, PropertyStructure>`.
    - [ ] Modify `transformMethodCollection` to return `NodeMethod[]` instead of `Record<string, MethodStructure>`.
    - [ ] Update internal types like `PropertyStructure` and `MethodStructure` or remove them if `NodeProperty` /
          `NodeMethod` from `DependencyGraph/types.ts` can be used directly or with minimal adaptation during
          transformation.
    - [ ] Ensure that the `ClassStructure` and `InterfaceStructure` (as used within `ModuleStructure` assembled by
          `GraphDataAssembler`) correctly store these `NodeProperty[]` and `NodeMethod[]`.
2.  **Type Definition Update (`src/client/components/DependencyGraph/types.ts`):**
    - [ ] Modify `ClassStructure` and `InterfaceStructure` to expect `properties: NodeProperty[]` and
          `methods: NodeMethod[]`.
3.  **Node Generation Logic (`src/client/utils/createGraphNodes.ts`):**
    - [ ] **Goal:** Correctly populate nodes with their properties and methods.
    - [ ] Remove or significantly refactor the `getMembersAsProperties` function (currently in
          `DependencyGraph/index.tsx`).
    - [ ] Modify the node creation logic to directly use the `properties: NodeProperty[]` and `methods: NodeMethod[]`
          from the `ClassStructure` and `InterfaceStructure` instances (which are prepared by the `GraphDataAssembler`).
    - [ ] Ensure `DependencyNode` data (`data` field) is correctly populated with these arrays.
4.  **Node Detail Display (`src/client/components/DependencyGraph/components/NodeDetails.tsx`):**
    - [ ] Verify it correctly iterates over `node.data.properties` (now `NodeProperty[]`) and `node.data.methods` (now
          `NodeMethod[]`).

## III. Graph Layout Engine (ELKJS Integration)

1.  **Layout Processor Implementation (`src/client/layout/`):**
    - [ ] **Goal:** Replace the current basic layout with a robust hierarchical layout using ELKJS.
    - [ ] Create `ElkLayoutProcessor.ts` (or modify `WebWorkerLayoutProcessor.ts`).
      - [ ] Implement logic to transform React Flow nodes/edges into the ELKJS graph structure (nodes with `id`,
            `width`, `height`, `layoutOptions`; edges with `id`, `sources: [string]`, `targets: [string]`).
      - [ ] Configure ELKJS layout options. Suggested initial options:
        ```javascript
        {
          'elk.algorithm': 'layered', // or 'org.eclipse.elk.layered'
          'elk.direction': 'DOWN', // Or 'RIGHT' based on preference
          'elk.spacing.nodeNode': '50', // Adjust as needed
          'elk.layered.spacing.nodeNodeBetweenLayers': '70', // Adjust as needed
          'org.eclipse.elk.edgeRouting': 'ORTHOGONAL',
          'org.eclipse.elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF', // Or 'NETWORK_SIMPLEX'
          'org.eclipse.elk.layered.cycleBreaking.strategy': 'GREEDY',
        }
        ```
      - [ ] Handle the promise returned by `elk.layout(graph)`.
      - [ ] Transform the layouted ELKJS graph (node positions and dimensions) back into React Flow node updates
            (specifically `node.position`).
      - [ ] Consider running ELKJS in a Web Worker for performance if layout calculations are slow for large graphs
            (current `WebWorkerLayoutProcessor.ts` can be adapted).
2.  **Integration with `DependencyGraph` Component (`src/client/components/DependencyGraph/index.tsx`):**
    - [ ] Instantiate and use the new ELKJS-based layout processor.
    - [ ] Ensure the `processGraphLayout` callback correctly invokes the new layout logic.
    - [ ] Verify node dimensions are correctly passed to ELKJS (React Flow's `useNodes` might not have dimensions until
          first render; ELKJS needs them. Custom nodes in `DependencyNode.tsx` might need to report their
          initial/estimated size or use fixed sizes for ELK).

## IV. React Flow Visualization Enhancements

1.  **Node Grouping & Hierarchy:**
    - [ ] Confirm React Flow correctly renders parent-child relationships using `parentId` for packages, modules, and
          folder nodes (if HierarchicalLayoutStrategy is used).
    - [ ] Ensure `extent: 'parent'` is used for child nodes so they are contained within their parents.
    - [ ] Style group nodes (packages, folders) appropriately.
2.  **Edge Rendering:**
    - [ ] Review `createGraphEdges.ts` for correctness of edge sources, targets, and types.
    - [ ] Ensure different edge types (import, extends, implements) are visually distinct (styles in `graphTheme.ts`).
    - [ ] Debug any missing or incorrectly routed edges.
3.  **Custom Node Display (`DependencyNode.tsx`):**
    - [ ] Verify that all relevant information (name, type, properties, methods) is displayed correctly for each node
          type (package, module, class, interface).
    - [ ] Ensure styles are applied correctly based on node type and state (selected).
4.  **Interactivity:**
    - [ ] Test node selection and the display of `NodeDetails.tsx`.
    - [ ] Test zoom/pan controls.
    - [ ] Test search functionality (`GraphSearch.tsx`).

## V. Server-Side Data Provision

1.  **`ApiServerResponder.ts` Review (`src/server/`):**
    - [ ] Ensure `getModules` correctly retrieves and populates all necessary sub-data for modules (classes, interfaces,
          methods, properties, parameters).
    - [ ] Confirm that the data structure returned to the client matches what `GraphDataAssembler.ts` expects.
2.  **Repository Review (`src/server/db/repositories/`):**
    - [ ] Spot-check key repositories (e.g., `ClassRepository`, `InterfaceRepository`) to ensure `retrieve` methods
          fetch all constituent parts (methods, properties with their parameters). The current implementation seems to
          do this by calling other repositories.

## VI. Testing & Documentation

1.  **Unit Tests:**
    - [ ] Write unit tests for the new ELKJS layout processing logic.
    - [ ] Add tests for `GraphDataAssembler.ts` transformations.
    - [ ] Add tests for `createGraphNodes.ts` and `createGraphEdges.ts`.
2.  **Manual Testing:**
    - [ ] Test with diverse codebase structures (small, large, complex dependencies).
    - [ ] Verify layout is hierarchical and readable.
    - [ ] Check for any console errors or warnings.
3.  **Documentation Updates:**
    - [ ] Update `packages/magus-typescript-viewer/README.md` with new features, setup, and usage.
    - [ ] Ensure this `development_plan.md` is comprehensive and up-to-date.

## VII. Nice-to-Haves (Post-Core Fixes)

- [ ] **Layout Strategy Picker:** Allow users to switch between different layout algorithms (e.g., ELKJS layered,
      force-directed) via UI controls.
- [ ] **Performance Profiling:** For very large graphs, profile rendering and layout times.
- [ ] **Advanced Filtering:** UI controls to filter nodes/edges by type, path, or other metadata.
- [ ] **Save/Load Layout:** Persist user-adjusted layouts.
- [ ] **Expand/Collapse Groups:** Allow collapsing package/module groups in the UI.

This plan provides a structured approach. I will proceed with these steps, prioritizing fixes for data flow and layout.
