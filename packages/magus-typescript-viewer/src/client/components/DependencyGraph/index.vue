<script setup lang="ts">
import { Background } from '@vue-flow/background';
import { Panel, VueFlow, useVueFlow } from '@vue-flow/core';
import { computed, onUnmounted, watch } from 'vue';

import { createLogger } from '../../../shared/utils/logger';
import { WebWorkerLayoutProcessor } from '../../layout/WebWorkerLayoutProcessor';
import { useGraphStore } from '../../stores/graphStore';
import { getEdgeStyle, getNodeStyle, graphTheme } from '../../theme/graphTheme';
import { createGraphEdges } from '../../utils/createGraphEdges';
import { createGraphNodes } from '../../utils/createGraphNodes';
import { measurePerformance } from '../../utils/performanceMonitoring';
import GraphControls from './components/GraphControls.vue';
import GraphSearch from './components/GraphSearch.vue';
import NodeDetails from './components/NodeDetails.vue';
import { nodeTypes } from './nodes/nodes';

import type {
  DependencyEdgeKind,
  DependencyKind,
  DependencyNode,
  DependencyPackageGraph,
  GraphEdge,
  SearchResult,
} from './types';

import '@vue-flow/core/dist/style.css';

const graphLogger = createLogger('DependencyGraph');

export interface DependencyGraphProps {
  data: DependencyPackageGraph;
}

const props = defineProps<DependencyGraphProps>();

// Get graph state from Pinia store
const graphStore = useGraphStore();
const nodes = computed(() => graphStore['nodes']);
const edges = computed(() => graphStore['edges']);
const selectedNode = computed(() => graphStore['selectedNode']);

const { fitView } = useVueFlow();

// Keep a reference to the layout processor for cleanup
let layoutProcessor: WebWorkerLayoutProcessor | null = null;

// Layout configuration state optimized for module import visualization
const layoutConfig = {
  direction: 'LR' as 'LR' | 'RL' | 'TB' | 'BT', // Left-to-right flow
  nodeSpacing: 80, // Space between nodes in same rank
  rankSpacing: 200, // Space between ranks (layers) - increased for clarity
  edgeSpacing: 30, // Space between parallel edges
};

// Create WebWorkerLayoutProcessor
const initializeLayoutProcessor = () => {
  // Clean up previous instance if it exists
  if (layoutProcessor) {
    layoutProcessor.dispose();
  }

  // Create a new instance
  // Note: WebWorkerLayoutProcessor internally converts TB/LR/etc to DOWN/RIGHT/etc
  layoutProcessor = new WebWorkerLayoutProcessor({
    direction: layoutConfig.direction,
    nodeSpacing: layoutConfig.nodeSpacing,
    rankSpacing: layoutConfig.rankSpacing,
    edgeSpacing: layoutConfig.edgeSpacing,
    theme: graphTheme,
    animationDuration: 150,
  });
};

// Clean up the worker when component unmounts
onUnmounted(() => {
  if (layoutProcessor) {
    layoutProcessor.dispose();
    layoutProcessor = null;
  }
});

// Process graph layout using web worker
const processGraphLayout = async (graphData: { nodes: DependencyNode[]; edges: GraphEdge[] }) => {
  if (!layoutProcessor) return;

  try {
    // Start performance measurement
    performance.mark('layout-start');

    // Process layout using the web worker
    const result = await layoutProcessor.processLayout(graphData);

    // Force the correct types for nodes and edges
    const typedNodes = result.nodes as unknown as DependencyNode[];
    const typedEdges = result.edges as unknown as GraphEdge[];

    // Debug: Check edges after layout processing
    graphLogger.info(`After layout: ${typedEdges.length} edges`);
    if (typedEdges.length > 0) {
      graphLogger.info(
        'Edges still have hidden=false:',
        typedEdges.every((e) => e.hidden === false)
      );
      graphLogger.info('Sample edge after layout:', typedEdges[0]);
    }

    // Update nodes without transition for better dragging performance
    graphStore['setNodes'](typedNodes);
    graphStore['setEdges'](typedEdges);

    // Debug: Verify store state
    graphLogger.info('Store edges count:', edges.value.length);

    // Fit view after layout with faster animation
    await fitView({ duration: 150, padding: 0.1 });

    // End performance measurement
    performance.mark('layout-end');
    measurePerformance('graph-layout', 'layout-start', 'layout-end');
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error during layout processing');
    graphLogger.error('Layout processing failed:', error);
    // Potentially update UI to show error state to the user
  }
};

// Initialize graph
const initializeGraph = async () => {
  performance.mark('graph-init-start');

  // Initialize layout processor
  initializeLayoutProcessor();

  // Create nodes and edges using extracted utilities
  // For now, show only modules with their import relationships (no packages, no classes)
  const graphNodes = createGraphNodes(props.data, {
    includePackages: false, // No package nodes = cleaner module view
    includeClasses: false, // No classes = focus on module structure
  });
  const graphEdges = createGraphEdges(props.data) as unknown as GraphEdge[];

  // Debug: Log edge creation
  graphLogger.info(`Created ${graphNodes.length} nodes and ${graphEdges.length} edges`);
  if (graphEdges.length > 0) {
    graphLogger.info('Sample edges:', graphEdges.slice(0, 3));
    graphLogger.info('First edge FULL object:', JSON.stringify(graphEdges[0], null, 2));
    const edgeTypes = [...new Set(graphEdges.map((e) => e.data?.type))];
    graphLogger.info('Edge types:', edgeTypes);

    // Count edges by type
    const edgeTypeCounts: Record<string, number> = {};
    graphEdges.forEach((e) => {
      const type = e.data?.type ?? 'unknown';
      edgeTypeCounts[type] = (edgeTypeCounts[type] ?? 0) + 1;
    });
    graphLogger.info('Edge counts by type:', edgeTypeCounts);

    graphLogger.info(
      'All edges have hidden=false:',
      graphEdges.every((e) => e.hidden === false)
    );

    // Validate edge connections
    const nodeIds = new Set(graphNodes.map((n) => n.id));
    const invalidEdges = graphEdges.filter((e) => !nodeIds.has(e.source) || !nodeIds.has(e.target));
    if (invalidEdges.length > 0) {
      graphLogger.warn(`Found ${invalidEdges.length} edges with invalid source/target IDs:`, invalidEdges.slice(0, 3));
    } else {
      graphLogger.info('All edge connections are valid');
    }
  } else {
    graphLogger.warn('No edges created! Check data structure.');
  }

  // Process initial layout
  await processGraphLayout({ nodes: graphNodes, edges: graphEdges });

  performance.mark('graph-init-end');
  measurePerformance('graph-initialization', 'graph-init-start', 'graph-init-end');
};

// Watch for data changes
watch(() => props.data, initializeGraph, { immediate: true });

// Node click handler with focused layout
const onNodeClick = async ({ node }: { node: unknown }): Promise<void> => {
  const selectedNode = node as DependencyNode;
  graphStore['setSelectedNode'](selectedNode);

  // Find all connected node IDs
  const connectedNodeIds = new Set<string>([selectedNode.id]);
  const connectedEdges: GraphEdge[] = [];

  edges.value.forEach((edge: GraphEdge) => {
    if (edge.source === selectedNode.id) {
      connectedNodeIds.add(edge.target);
      connectedEdges.push(edge);
    } else if (edge.target === selectedNode.id) {
      connectedNodeIds.add(edge.source);
      connectedEdges.push(edge);
    }
  });

  graphLogger.info(`Selected node: ${selectedNode.data.label}, Connected nodes: ${connectedNodeIds.size - 1}`);

  // Create focused subgraph with selected node and its connections
  const focusedNodes = nodes.value
    .filter((n: DependencyNode) => connectedNodeIds.has(n.id))
    .map((n: DependencyNode) => ({
      ...n,
      style: {
        ...n.style,
        borderWidth: n.id === selectedNode.id ? '3px' : '2px',
        borderColor: n.id === selectedNode.id ? '#00ffff' : '#61dafb',
      },
    }));

  const focusedEdges = connectedEdges.map((edge: GraphEdge) => ({
    ...edge,
    style: {
      ...edge.style,
      stroke: '#00ffff',
      strokeWidth: 4,
      opacity: 1,
    },
    animated: true,
  }));

  // Trigger re-layout with focused subgraph
  await processGraphLayout({
    nodes: focusedNodes,
    edges: focusedEdges,
  });

  // Fit view to the focused subgraph
  await fitView({
    duration: 300,
    padding: 0.3,
    nodes: Array.from(connectedNodeIds),
  });
};

// Pane click handler to deselect and restore full graph
const onPaneClick = async (): Promise<void> => {
  graphStore['setSelectedNode'](null);

  graphLogger.info('Restoring full graph view');

  // Restore full graph by re-initializing
  await initializeGraph();
};

// Filter handler for relationship types
const handleRelationshipFilterChange = (types: string[]) => {
  graphStore['setEdges'](
    edges.value.map((edge: GraphEdge) => ({
      ...edge,
      hidden: !types.includes(edge.data?.type ?? 'default'),
    }))
  );
};

// Layout change handler
const handleLayoutChange = async (config: { direction?: string; nodeSpacing?: number; rankSpacing?: number }) => {
  if (config.direction) {
    layoutConfig.direction = config.direction as 'LR' | 'RL' | 'TB' | 'BT';
  }
  if (config.nodeSpacing !== undefined) {
    layoutConfig.nodeSpacing = config.nodeSpacing;
  }
  if (config.rankSpacing !== undefined) {
    layoutConfig.rankSpacing = config.rankSpacing;
  }

  // Recreate layout processor with new config
  initializeLayoutProcessor();

  // Re-run layout
  const graphNodes = createGraphNodes(props.data);
  const graphEdges = createGraphEdges(props.data) as unknown as GraphEdge[];
  await processGraphLayout({ nodes: graphNodes, edges: graphEdges });
};

// Search result handler
const handleSearchResult = (result: SearchResult) => {
  // Update node styling based on search results
  graphStore['setNodes'](
    nodes.value.map((node: DependencyNode) => ({
      ...node,
      selected: result.nodes.some((searchNode) => searchNode.id === node.id),
      style: {
        ...getNodeStyle(node.type as DependencyKind),
        opacity: result.nodes.length === 0 ? 1 : result.nodes.some((searchNode) => searchNode.id === node.id) ? 1 : 0.2,
      },
    }))
  );

  // Update edge styling based on search results
  graphStore['setEdges'](
    edges.value.map((edge: GraphEdge) => ({
      ...edge,
      selected: result.edges.some((searchEdge) => searchEdge.id === edge.id),
      style: {
        ...getEdgeStyle(toDependencyEdgeKind(edge.data?.type)),
        opacity: result.edges.length === 0 ? 1 : result.edges.some((searchEdge) => searchEdge.id === edge.id) ? 1 : 0.2,
      },
    }))
  );

  // Highlight path if it exists
  if (result.path) {
    graphStore['setNodes'](
      nodes.value.map((node: DependencyNode) => ({
        ...node,
        style: {
          ...getNodeStyle(node.type as DependencyKind),
          opacity: result.path?.some((pathNode) => pathNode.id === node.id) ? 1 : 0.2,
          borderWidth: result.path?.some((pathNode) => pathNode.id === node.id)
            ? graphTheme.edges.sizes.width.selected
            : graphTheme.edges.sizes.width.default,
        },
      }))
    );
  }
};

// Keyboard navigation handlers
const handleKeyDown = (event: KeyboardEvent) => {
  if (
    selectedNode.value &&
    (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'ArrowDown')
  ) {
    event.preventDefault();
    const connectedEdges = edges.value.filter(
      (edge: GraphEdge) => edge.source === selectedNode.value?.id || edge.target === selectedNode.value?.id
    );
    if (connectedEdges.length > 0) {
      let nextNodeId: string | undefined;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        if (connectedEdges[0]) {
          nextNodeId =
            connectedEdges[0].source === selectedNode.value.id ? connectedEdges[0].target : connectedEdges[0].source;
        }
      } else {
        const lastEdge = connectedEdges[connectedEdges.length - 1];
        if (lastEdge) {
          nextNodeId = lastEdge.source === selectedNode.value.id ? lastEdge.target : lastEdge.source;
        }
      }
      if (nextNodeId) {
        const nextNode = nodes.value.find((node: DependencyNode) => node.id === nextNodeId);
        if (nextNode) {
          graphStore['setSelectedNode'](nextNode);
          void fitView({
            nodes: [nextNode.id],
            duration: 150,
            padding: 0.5,
          });
        }
      }
    }
  }
};

function toDependencyEdgeKind(type: string | undefined): DependencyEdgeKind {
  if (
    type === 'dependency' ||
    type === 'devDependency' ||
    type === 'peerDependency' ||
    type === 'import' ||
    type === 'export' ||
    type === 'inheritance' ||
    type === 'implements' ||
    type === 'extends' ||
    type === 'contains'
  ) {
    return type;
  }
  return 'dependency';
}
</script>

<template>
  <div class="h-full w-full" role="application" aria-label="TypeScript dependency graph visualization">
    <!-- Use a standard button for keyboard controls instead of a non-interactive div -->
    <button
      class="visualization-keyboard-control h-full w-full outline-none bg-transparent border-none p-0 cursor-default text-left"
      @keydown="handleKeyDown"
      aria-label="Press arrow keys to navigate between connected nodes"
    >
      <!-- The actual graph -->
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :node-types="nodeTypes as any"
        :fit-view-on-init="true"
        :min-zoom="0.1"
        :max-zoom="2"
        :default-viewport="{ x: 0, y: 0, zoom: 0.5 }"
        :snap-to-grid="true"
        :snap-grid="[15, 15]"
        :pan-on-scroll="true"
        :zoom-on-scroll="true"
        :zoom-on-double-click="false"
        :elevate-edges-on-select="true"
        :default-edge-options="{
          style: { stroke: '#61dafb', strokeWidth: 3 },
          markerEnd: { type: 'arrowclosed', width: 20, height: 20 },
          zIndex: 1000,
        }"
        @node-click="onNodeClick"
        @pane-click="onPaneClick"
      >
        <Background />
        <GraphControls
          @relationship-filter-change="handleRelationshipFilterChange"
          @layout-change="handleLayoutChange"
        />
        <GraphSearch @search-result="handleSearchResult" :nodes="nodes" :edges="edges" />
        <NodeDetails v-if="selectedNode" :node="selectedNode" />

        <!-- Back to Full Graph button -->
        <Panel v-if="selectedNode" position="bottom-left">
          <button
            @click="onPaneClick"
            class="px-4 py-2 bg-primary-main text-white rounded-md hover:bg-primary-dark transition-colors shadow-lg border border-primary-light"
            aria-label="Return to full graph view"
          >
            ← Back to Full Graph
          </button>
        </Panel>
      </VueFlow>
    </button>
  </div>
</template>
