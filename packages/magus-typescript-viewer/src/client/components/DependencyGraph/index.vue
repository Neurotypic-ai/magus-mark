<script setup lang="ts">
import { Background } from '@vue-flow/background';
import { VueFlow, useVueFlow } from '@vue-flow/core';
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

// Layout configuration state
const layoutConfig = {
  direction: 'LR' as 'LR' | 'RL' | 'TB' | 'BT',
  nodeSpacing: 100,
  rankSpacing: 150,
};

// Create WebWorkerLayoutProcessor
const initializeLayoutProcessor = () => {
  // Clean up previous instance if it exists
  if (layoutProcessor) {
    layoutProcessor.dispose();
  }

  // Create a new instance
  layoutProcessor = new WebWorkerLayoutProcessor({
    direction: layoutConfig.direction,
    nodeSpacing: layoutConfig.nodeSpacing,
    rankSpacing: layoutConfig.rankSpacing,
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

    // Update nodes without transition for better dragging performance
    graphStore['setNodes'](typedNodes);
    graphStore['setEdges'](typedEdges);

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
  const graphNodes = createGraphNodes(props.data);
  const graphEdges = createGraphEdges(props.data) as unknown as GraphEdge[];

  // Process initial layout
  await processGraphLayout({ nodes: graphNodes, edges: graphEdges });

  performance.mark('graph-init-end');
  measurePerformance('graph-initialization', 'graph-init-start', 'graph-init-end');
};

// Watch for data changes
watch(() => props.data, initializeGraph, { immediate: true });

// Node click handler
const onNodeClick = ({ node }: { node: unknown }): void => {
  graphStore['setSelectedNode'](node as DependencyNode);
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
        @node-click="onNodeClick"
      >
        <Background />
        <GraphControls
          @relationship-filter-change="handleRelationshipFilterChange"
          @layout-change="handleLayoutChange"
        />
        <GraphSearch @search-result="handleSearchResult" :nodes="nodes" :edges="edges" />
        <NodeDetails v-if="selectedNode" :node="selectedNode" />
      </VueFlow>
    </button>
  </div>
</template>
