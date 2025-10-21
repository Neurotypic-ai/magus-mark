<script setup lang="ts">
import cytoscape from 'cytoscape';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import { createLogger } from '../../../shared/utils/logger';
import { clusterByFolder } from '../../graph/cluster/folders';
import { collapseSccs } from '../../graph/cluster/scc';
import { applyElkLayout } from '../../layout/elkLayoutEngine';
import { useGraphSettings } from '../../stores/graphSettings';
import { useGraphStore } from '../../stores/graphStore';
import { getCytoscapeStylesheet } from '../../theme/cytoscapeTheme';
import { graphTheme } from '../../theme/graphTheme';
import { createGraphEdges } from '../../utils/createGraphEdges';
import { createGraphNodes } from '../../utils/createGraphNodes';
import { measurePerformance } from '../../utils/performanceMonitoring';
import GraphControls from './components/GraphControls.vue';
import GraphSearch from './components/GraphSearch.vue';
import NodeDetails from './components/NodeDetails.vue';

import type { Core as CytoscapeCore, ElementDefinition } from 'cytoscape';

import type {
  DependencyEdgeKind,
  DependencyKind,
  DependencyNode,
  DependencyPackageGraph,
  GraphEdge,
  SearchResult,
} from './types';

const graphLogger = createLogger('DependencyGraph');

export interface DependencyGraphProps {
  data: DependencyPackageGraph;
}

const props = defineProps<DependencyGraphProps>();

// Get graph state from Pinia store
const graphStore = useGraphStore();
const graphSettings = useGraphSettings();
const nodes = computed(() => graphStore['nodes']);
const edges = computed(() => graphStore['edges']);
const selectedNode = computed(() => graphStore['selectedNode']);

// Cytoscape instance
const cyRef = ref<CytoscapeCore | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

// Cleanup for custom gesture handlers
let removeGestureHandlers: (() => void) | null = null;

// Layout runs directly (no web worker needed - ELK handles its own threading)

// Layout configuration state
const layoutConfig = {
  direction: 'RIGHT' as 'DOWN' | 'UP' | 'LEFT' | 'RIGHT',
  nodeSpacing: 150,
  layerSpacing: 250,
  edgeSpacing: 50,
  algorithm: 'layered' as 'layered' | 'force' | 'stress' | 'mrtree',
};

// Clean up when component unmounts
onUnmounted(() => {
  if (cyRef.value) {
    cyRef.value.destroy();
    cyRef.value = null;
  }
  if (removeGestureHandlers) {
    removeGestureHandlers();
    removeGestureHandlers = null;
  }
});

// Initialize Cytoscape
const initializeCytoscape = () => {
  if (!containerRef.value) return null;

  const cy = cytoscape({
    container: containerRef.value,
    style: getCytoscapeStylesheet(),
    minZoom: 0.1,
    maxZoom: 2,
    // Disable default wheel zoom so we can map gestures precisely
    userZoomingEnabled: false,
    userPanningEnabled: true,
  });

  // Add event listeners
  cy.on('tap', 'node', (evt) => {
    onNodeClick(evt.target);
  });

  cy.on('dbltap', 'node', (evt) => {
    void onNodeDoubleClick(evt.target);
  });

  cy.on('tap', (evt) => {
    if (evt.target === cy) {
      void onPaneClick();
    }
  });

  // Enable trackpad gestures: two-finger pan, pinch-zoom
  if (containerRef.value) {
    if (removeGestureHandlers) removeGestureHandlers();
    removeGestureHandlers = enableTrackpadGestures(cy, containerRef.value);
  }

  return cy;
};

// Process graph layout
const processGraphLayout = async (graphData: { nodes: DependencyNode[]; edges: GraphEdge[] }) => {
  if (!cyRef.value) return;

  try {
    performance.mark('layout-start');

    // Apply ELK layout directly
    const result = await applyElkLayout(graphData.nodes, graphData.edges, {
      direction: layoutConfig.direction,
      nodeSpacing: layoutConfig.nodeSpacing,
      layerSpacing: layoutConfig.layerSpacing,
      edgeSpacing: layoutConfig.edgeSpacing,
      algorithm: layoutConfig.algorithm,
      theme: graphTheme,
    });

    graphLogger.info(`Layout complete: ${result.nodes.length} nodes, ${result.edges.length} edges`);

    // Update the graph
    cyRef.value.elements().remove();

    // Add nodes and edges to Cytoscape
    const elements: ElementDefinition[] = [
      ...result.nodes.map((n) => ({
        group: 'nodes' as const,
        data: n.data,
        position: n.position,
      })),
      ...result.edges.map((e) => ({
        group: 'edges' as const,
        data: e.data,
      })),
    ];

    cyRef.value.add(elements);

    // Update store
    graphStore['setNodes'](result.nodes);
    graphStore['setEdges'](result.edges);

    // Fit view
    cyRef.value.fit(undefined, 50);

    performance.mark('layout-end');
    measurePerformance('graph-layout', 'layout-start', 'layout-end');
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error during layout processing');
    graphLogger.error('Layout processing failed:', error);
  }
};

// Map two-finger scroll to pan, pinch to zoom (ctrlKey wheel or Safari gesture)
function enableTrackpadGestures(cy: CytoscapeCore, container: HTMLDivElement): () => void {
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const wheelHandler = (e: WheelEvent) => {
    // We fully manage wheel; prevent default scroll/zoom
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    const renderedPosition = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (e.ctrlKey) {
      // Pinch-zoom on trackpad sets ctrlKey=true on WheelEvent in Chromium
      const factor = Math.pow(1.0015, -e.deltaY);
      const newLevel = clamp(cy.zoom() * factor, cy.minZoom(), cy.maxZoom());
      cy.zoom({ level: newLevel, renderedPosition });
    } else {
      // Two-finger pan: deltaX/deltaY translate the canvas
      cy.panBy({ x: -e.deltaX, y: -e.deltaY });
    }
  };

  container.addEventListener('wheel', wheelHandler, { passive: false });

  // Optional: Safari gesture events (non-standard)
  let baseZoom = cy.zoom();
  const center = () => ({ x: container.clientWidth / 2, y: container.clientHeight / 2 });
  const onGestureStart = (ev: Event) => {
    ev.preventDefault();
    baseZoom = cy.zoom();
  };
  const onGestureChange = (ev: Event) => {
    ev.preventDefault();
    const e = ev as Event & { scale?: number };
    const scale = typeof e.scale === 'number' ? e.scale : 1;
    const newLevel = clamp(baseZoom * scale, cy.minZoom(), cy.maxZoom());
    cy.zoom({ level: newLevel, renderedPosition: center() });
  };
  container.addEventListener('gesturestart', onGestureStart as EventListener, { passive: false });
  container.addEventListener('gesturechange', onGestureChange as EventListener, { passive: false });
  container.addEventListener('gestureend', (ev) => ev.preventDefault() as unknown as EventListener, { passive: false });

  return () => {
    container.removeEventListener('wheel', wheelHandler as EventListener);
    container.removeEventListener('gesturestart', onGestureStart as EventListener);
    container.removeEventListener('gesturechange', onGestureChange as EventListener);
    container.removeEventListener('gestureend', (ev) => ev.preventDefault() as unknown as EventListener);
  };
}

// Initialize graph
const initializeGraph = async () => {
  performance.mark('graph-init-start');

  graphLogger.info('Initializing graph with data:', {
    packageCount: props.data?.packages?.length ?? 0,
  });

  if (!props.data || !props.data.packages || props.data.packages.length === 0) {
    graphLogger.warn('No data available to create graph');
    graphStore['setNodes']([]);
    graphStore['setEdges']([]);
    return;
  }

  // Initialize Cytoscape if needed
  if (!cyRef.value) {
    cyRef.value = initializeCytoscape();
  }

  // Layout configuration is handled directly in processGraphLayout

  // Create nodes and edges
  const includePackages = graphSettings.showPackages;
  const includeClasses = graphSettings.showClasses;

  const graphNodes = createGraphNodes(props.data, {
    includePackages,
    includeClasses,
    visibleNodeTypes: graphSettings.visibleNodeTypes,
  });

  let graphEdges = createGraphEdges(props.data);

  // Filter edges to only include those connecting visible nodes
  const nodeIds = new Set(graphNodes.map((n) => n.data.id));
  graphEdges = graphEdges.filter((e) => nodeIds.has(e.data.source) && nodeIds.has(e.data.target));

  graphLogger.info(`Created ${graphNodes.length} nodes and ${graphEdges.length} edges`);

  // Optional transforms
  let nodesToLayout = graphNodes;
  let edgesToLayout = graphEdges;

  if (graphSettings.collapseScc) {
    const collapsed = collapseSccs(nodesToLayout, edgesToLayout);
    nodesToLayout = collapsed.nodes as DependencyNode[];
    edgesToLayout = collapsed.edges as GraphEdge[];
  }

  // Group modules by folder into compound parent nodes when enabled
  if (graphSettings.clusterByFolder) {
    const clustered = clusterByFolder(nodesToLayout, edgesToLayout);
    nodesToLayout = clustered.nodes as DependencyNode[];
    edgesToLayout = clustered.edges as GraphEdge[];
  }

  // Process layout
  await processGraphLayout({ nodes: nodesToLayout, edges: edgesToLayout });

  performance.mark('graph-init-end');
  measurePerformance('graph-initialization', 'graph-init-start', 'graph-init-end');
};

// Watch for data changes
watch(() => props.data, initializeGraph, { immediate: false });

// Initialize on mount
onMounted(() => {
  void initializeGraph();
});

// Single click handler - highlight connected nodes
const onNodeClick = (node: cytoscape.NodeSingular): void => {
  const clickedNodeId = node.id();
  const clickedNodeData = nodes.value.find((n) => n.data.id === clickedNodeId);

  if (!clickedNodeData) return;

  graphStore['setSelectedNode'](clickedNodeData);

  if (!cyRef.value) return;

  // Find connected nodes
  const connectedEdges = cyRef.value.edges().filter((edge) => {
    return edge.source().id() === clickedNodeId || edge.target().id() === clickedNodeId;
  });

  const connectedNodes = connectedEdges.connectedNodes();

  // Reset all nodes/edges
  cyRef.value.nodes().removeClass('highlighted dimmed selected');
  cyRef.value.edges().removeClass('highlighted dimmed');

  // Highlight connected elements
  node.addClass('selected');
  connectedNodes.addClass('highlighted');
  connectedEdges.addClass('highlighted');

  // Dim non-connected elements
  cyRef.value.nodes().not(node).not(connectedNodes).addClass('dimmed');
  cyRef.value.edges().not(connectedEdges).addClass('dimmed');
};

// Double click handler - show detailed view
const onNodeDoubleClick = async (node: cytoscape.NodeSingular): Promise<void> => {
  const nodeId = node.id();
  const nodeData = nodes.value.find((n) => n.data.id === nodeId);

  if (!nodeData) return;

  graphStore['setSelectedNode'](nodeData);

  // If it's a module node, show its internal structure
  if (nodeData.data.type === 'module') {
    graphLogger.info(`Expanding module view: ${nodeData.data.label}`);

    // TODO: Implement detailed module view
    // For now, just zoom to the node
    if (cyRef.value) {
      cyRef.value.animate({
        fit: {
          eles: node,
          padding: 100,
        },
        duration: 300,
      });
    }
  }
};

// Pane click handler to deselect and restore full graph
const onPaneClick = async (): Promise<void> => {
  graphStore['setSelectedNode'](null);

  if (cyRef.value) {
    cyRef.value.nodes().removeClass('highlighted dimmed selected');
    cyRef.value.edges().removeClass('highlighted dimmed');
    cyRef.value.fit(undefined, 50);
  }

  graphLogger.info('Restoring full graph view');
};

// Filter handler for relationship types
const handleRelationshipFilterChange = (types: string[]) => {
  if (!cyRef.value) return;

  cyRef.value.edges().forEach((edge) => {
    const edgeType = edge.data('type') as string;
    if (types.includes(edgeType)) {
      edge.style('display', 'element');
    } else {
      edge.style('display', 'none');
    }
  });
};

// Layout change handler
const handleLayoutChange = async (config: { direction?: string; nodeSpacing?: number; layerSpacing?: number }) => {
  if (config.direction) {
    switch (config.direction) {
      case 'LR':
        layoutConfig.direction = 'RIGHT';
        break;
      case 'RL':
        layoutConfig.direction = 'LEFT';
        break;
      case 'TB':
        layoutConfig.direction = 'DOWN';
        break;
      case 'BT':
        layoutConfig.direction = 'UP';
        break;
    }
  }
  if (config.nodeSpacing !== undefined) {
    layoutConfig.nodeSpacing = config.nodeSpacing;
  }
  if (config.layerSpacing !== undefined) {
    layoutConfig.layerSpacing = config.layerSpacing;
  }

  // Re-run layout with new config
  await initializeGraph();
};

// Node visibility change handler
const handleNodeVisibilityChange = async () => {
  await initializeGraph();
};

// Search result handler
const handleSearchResult = (result: SearchResult) => {
  if (!cyRef.value) return;

  // Reset highlighting
  cyRef.value.nodes().removeClass('highlighted dimmed search-result');
  cyRef.value.edges().removeClass('highlighted dimmed search-result');

  if (result.nodes.length === 0) return;

  // Highlight search results
  result.nodes.forEach((node) => {
    const cyNode = cyRef.value!.getElementById(node.data.id);
    cyNode.addClass('search-result');
  });

  result.edges.forEach((edge) => {
    const cyEdge = cyRef.value!.getElementById(edge.data.id);
    cyEdge.addClass('search-result');
  });

  // Dim non-results
  cyRef.value.nodes().not('.search-result').addClass('dimmed');
  cyRef.value.edges().not('.search-result').addClass('dimmed');

  // Fit to search results
  const resultNodes = cyRef.value.$('.search-result');
  if (resultNodes.length > 0) {
    cyRef.value.animate({
      fit: {
        eles: resultNodes,
        padding: 50,
      },
      duration: 300,
    });
  }
};
</script>

<template>
  <div class="h-full w-full relative" role="application" aria-label="TypeScript dependency graph visualization">
    <!-- Cytoscape container -->
    <div ref="containerRef" class="h-full w-full" />

    <!-- Controls overlay -->
    <div class="absolute top-4 left-4 z-10">
      <GraphControls
        @relationship-filter-change="handleRelationshipFilterChange"
        @layout-change="handleLayoutChange"
        @node-visibility-change="handleNodeVisibilityChange"
        @zoom-in="
          () =>
            cyRef?.zoom({
              level: cyRef.zoom() * 1.2,
              renderedPosition: { x: cyRef.width() / 2, y: cyRef.height() / 2 },
            })
        "
        @zoom-out="
          () =>
            cyRef?.zoom({
              level: cyRef.zoom() * 0.8,
              renderedPosition: { x: cyRef.width() / 2, y: cyRef.height() / 2 },
            })
        "
        @fit-view="() => cyRef?.fit(undefined, 50)"
        @reset-layout="() => void initializeGraph()"
        @toggle-show-packages="
          (v: boolean) => {
            graphSettings.setShowPackages(v);
            void initializeGraph();
          }
        "
        @toggle-show-classes="
          (v: boolean) => {
            graphSettings.setShowClasses(v);
            void initializeGraph();
          }
        "
        @toggle-cluster-folder="
          (v: boolean) => {
            graphSettings.setClusterByFolder(v);
            void initializeGraph();
          }
        "
      />
    </div>

    <!-- Search overlay -->
    <div class="absolute top-4 right-4 z-10">
      <GraphSearch @search-result="handleSearchResult" :nodes="nodes" :edges="edges" />
    </div>

    <!-- Node details panel -->
    <div v-if="selectedNode" class="absolute bottom-4 right-4 z-10">
      <NodeDetails :node="selectedNode" />
    </div>

    <!-- Back to Full Graph button -->
    <div v-if="selectedNode" class="absolute bottom-4 left-4 z-10">
      <button
        @click="onPaneClick"
        class="px-4 py-2 bg-primary-main text-white rounded-md hover:bg-primary-dark transition-colors shadow-lg border border-primary-light"
        aria-label="Return to full graph view"
      >
        ← Back to Full Graph
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Ensure the container fills the available space */
.h-full {
  height: 100%;
}

.w-full {
  width: 100%;
}
</style>
