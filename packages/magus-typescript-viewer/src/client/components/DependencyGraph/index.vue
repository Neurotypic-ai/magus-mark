<script setup lang="ts">
import { Background } from '@vue-flow/background';
import { MarkerType, PanOnScrollMode, Panel, Position, VueFlow, useVueFlow } from '@vue-flow/core';
import { storeToRefs } from 'pinia';
import { computed, nextTick, onMounted, onUnmounted, provide, ref, shallowRef, watch } from 'vue';

import { createLogger } from '../../../shared/utils/logger';
import { DEFAULT_ANALYTICS_CONFIG } from '../../analytics/graphAnalytics';
import { WebWorkerLayoutProcessor } from '../../layout/WebWorkerLayoutProcessor';
import { useGraphSettings } from '../../stores/graphSettings';
import { useGraphStore } from '../../stores/graphStore';
import { getEdgeStyle, getNodeStyle, graphTheme } from '../../theme/graphTheme';
import { createGraphEdges } from '../../utils/createGraphEdges';
import { createGraphNodes } from '../../utils/createGraphNodes';
import { measurePerformance } from '../../utils/performanceMonitoring';
import { DEFAULT_EDGE_CONFIG, EdgeVisualizationEngine } from '../../visualization/edgeVisualization';
import AnalyticsDashboard from '../AnalyticsDashboard.vue';
import GraphControls from './components/GraphControls.vue';
import GraphSearch from './components/GraphSearch.vue';
import NodeDetails from './components/NodeDetails.vue';
import { mapTypeCollection } from './mapTypeCollection';
import { nodeTypes } from './nodes/nodes';

import type { Class } from '../../../shared/types/Class';
import type { Interface } from '../../../shared/types/Interface';
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
const graphSettings = useGraphSettings();
const { nodes, edges, selectedNode } = storeToRefs(graphStore);

const { fitView, updateNodeInternals, updateNode } = useVueFlow();

// Keep a reference to the layout processor for cleanup
const layoutProcessor = shallowRef<WebWorkerLayoutProcessor | null>(null);

// Track layout state to prevent infinite loops - use refs for reactivity
const isInitialLayout = ref(false);
const hasAppliedMeasuredLayout = ref(false);
const isLayoutRunning = ref(false);

// Re-entry detection for debugging
const onNodesInitializedCallCount = ref(0);

// Track progressive rendering state to prevent dimension updates during initial render
const isProgressiveRendering = ref(false);

// Track when graph data is ready for VueFlow to mount (prevents ResizeObserver recursion)
const isGraphReady = ref(false);

// Provide flag to child node components so they can skip updateNodeInternals during progressive rendering
provide('isProgressiveRendering', isProgressiveRendering);

// Edge visualization engine
const edgeVisualizationEngine = ref<EdgeVisualizationEngine | null>(null);
const enhancedEdges = ref<any[]>([]);

// Shallow equality helpers to avoid redundant reactive writes
function areNodesShallowEqual(a: DependencyNode[], b: DependencyNode[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const na = a[i] as unknown as { id: string; position: { x: number; y: number }; width?: number; height?: number };
    const nb = b[i] as unknown as { id: string; position: { x: number; y: number }; width?: number; height?: number };
    if (na.id !== nb.id) return false;
    if (na.position.x !== nb.position.x || na.position.y !== nb.position.y) return false;
    if ((na.width ?? 0) !== (nb.width ?? 0)) return false;
    if ((na.height ?? 0) !== (nb.height ?? 0)) return false;
  }
  return true;
}

function areEdgesShallowEqual(a: GraphEdge[], b: GraphEdge[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const ea = a[i] as unknown as { id: string };
    const eb = b[i] as unknown as { id: string };
    if (ea.id !== eb.id) return false;
  }
  return true;
}

// Memoize measured dimensions to avoid redundant collection
const measuredDimensions = shallowRef<Map<string, { width: number; height: number }>>(new Map());

// Computed: Node IDs set for fast lookups (memoized)
// const nodeIdsSet = computed(() => new Set(nodes.value.map((n) => n.id)));

// Computed: Dynamic graph extents based on actual node positions + padding
const graphExtents = computed(
  (): { translate: [[number, number], [number, number]]; node: [[number, number], [number, number]] } => {
    // CRITICAL: Return static extents during progressive rendering to prevent VueFlow's
    // watchNodeExtent from triggering updateNodeInternals which causes recursive updates
    if (isProgressiveRendering.value) {
      return {
        translate: [
          [-5000, -5000],
          [5000, 5000],
        ],
        node: [
          [-5000, -5000],
          [5000, 5000],
        ],
      };
    }

    if (nodes.value.length === 0) {
      // Default extents if no nodes
      return {
        translate: [
          [-1000, -1000],
          [1000, 1000],
        ],
        node: [
          [-1000, -1000],
          [1000, 1000],
        ],
      };
    }

    // Calculate bounding box of all nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.value.forEach((node) => {
      const x = node.position.x;
      const y = node.position.y;

      // Prefer measured dimensions if available
      const measured = (node as unknown as { measured?: { width?: number; height?: number } }).measured;
      const width = measured?.width ?? (typeof node.width === 'number' ? node.width : 50);

      // Subtract header offset so header bars don't inflate graph extents
      const HEADER_OFFSET = 32;
      const rawHeight = measured?.height ?? (typeof node.height === 'number' ? node.height : 30);
      const nodeType = (node as unknown as { type?: string }).type;
      const applyHeaderOffset = nodeType !== 'package';
      const height = applyHeaderOffset ? Math.max(rawHeight - HEADER_OFFSET, 24) : rawHeight;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    // Add 5000px padding on all sides
    const padding = 5000;

    return {
      translate: [
        [minX - padding, minY - padding],
        [maxX + padding, maxY + padding],
      ],
      node: [
        [minX - padding, minY - padding],
        [maxX + padding, maxY + padding],
      ],
    };
  }
);

// Layout configuration state - dagre uses hierarchical layout with configurable direction
const layoutConfig = {
  direction: 'LR' as 'LR' | 'RL' | 'TB' | 'BT', // Left-to-right flow
  nodeSpacing: 150, // Space between nodes in same rank (increased for better separation)
  rankSpacing: 250, // Space between ranks (layers) - increased for clarity
  edgeSpacing: 50, // Space between parallel edges
};

// Helper to get handle positions based on layout direction
const getHandlePositions = (
  direction: 'LR' | 'RL' | 'TB' | 'BT'
): { sourcePosition: Position; targetPosition: Position } => {
  switch (direction) {
    case 'LR':
      return { sourcePosition: Position.Right, targetPosition: Position.Left };
    case 'RL':
      return { sourcePosition: Position.Left, targetPosition: Position.Right };
    case 'TB':
      return { sourcePosition: Position.Bottom, targetPosition: Position.Top };
    case 'BT':
      return { sourcePosition: Position.Top, targetPosition: Position.Bottom };
  }
};

// Create WebWorkerLayoutProcessor
const initializeLayoutProcessor = () => {
  // Clean up previous instance if it exists
  if (layoutProcessor.value) {
    layoutProcessor.value.dispose();
  }

  // Create a new instance
  layoutProcessor.value = new WebWorkerLayoutProcessor({
    direction: layoutConfig.direction,
    nodeSpacing: layoutConfig.nodeSpacing,
    rankSpacing: layoutConfig.rankSpacing,
    edgeSpacing: layoutConfig.edgeSpacing,
    theme: graphTheme,
    animationDuration: 150,
    // Enhanced layout options
    useMultiAlgorithm: graphSettings.useMultiAlgorithm,
    // @ts-expect-error - string type from store is compatible with LayoutStrategy union
    layoutStrategy: graphSettings.layoutStrategy,
    forceDirected: graphSettings.forceDirectedConfig,
    grid: graphSettings.gridConfig,
  });
};

// Prevent browser zoom gestures on mount
onMounted(() => {
  // Prevent default zoom behavior on wheel with ctrl/cmd
  const preventBrowserZoom = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  };

  // Prevent pinch zoom on trackpad/touchscreen
  const preventPinchZoom = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  // Prevent gesture zoom (Safari)
  const preventGestureZoom = (e: Event) => {
    e.preventDefault();
  };

  document.addEventListener('wheel', preventBrowserZoom, { passive: false });
  document.addEventListener('touchmove', preventPinchZoom, { passive: false });
  document.addEventListener('gesturestart', preventGestureZoom);
  document.addEventListener('gesturechange', preventGestureZoom);
  document.addEventListener('gestureend', preventGestureZoom);

  // Initialize edge visualization engine
  edgeVisualizationEngine.value = new EdgeVisualizationEngine(DEFAULT_EDGE_CONFIG);

  // Store cleanup functions
  onUnmounted(() => {
    document.removeEventListener('wheel', preventBrowserZoom);
    document.removeEventListener('touchmove', preventPinchZoom);
    document.removeEventListener('gesturestart', preventGestureZoom);
    document.removeEventListener('gesturechange', preventGestureZoom);
    document.removeEventListener('gestureend', preventGestureZoom);

    // Clean up edge visualization
    if (edgeVisualizationEngine.value) {
      edgeVisualizationEngine.value.stopAnimations();
    }
  });
});

// Clean up the worker when component unmounts
onUnmounted(() => {
  if (layoutProcessor.value) {
    layoutProcessor.value.dispose();
    layoutProcessor.value = null;
  }
  // Clear memoized data
  measuredDimensions.value.clear();
});

// Process graph layout using web worker
const processGraphLayout = async (graphData: { nodes: DependencyNode[]; edges: GraphEdge[] }) => {
  if (!layoutProcessor.value) {
    graphLogger.error('Layout processor is null - cannot run layout');
    return;
  }

  if (isLayoutRunning.value) {
    graphLogger.warn('Layout already running - skipping duplicate layout request');
    return;
  }

  graphLogger.info(`Starting layout with ${graphData.nodes.length} nodes and ${graphData.edges.length} edges`);
  isLayoutRunning.value = true;

  // Use unique mark names to avoid conflicts with multiple calls
  const timestamp = Date.now();
  const startMark = `layout-start-${timestamp}`;
  const endMark = `layout-end-${timestamp}`;

  performance.mark(startMark);

  try {
    // Process layout using the web worker
    graphLogger.debug('Calling web worker for layout processing...');
    const result = await layoutProcessor.value.processLayout(graphData);
    graphLogger.debug('Web worker layout processing complete');

    // Force the correct types for nodes and edges
    const typedNodes = result.nodes as unknown as DependencyNode[];
    const typedEdges = result.edges as unknown as GraphEdge[];

    graphLogger.debug(`Layout result: ${typedNodes.length} nodes, ${typedEdges.length} edges`);

    // Explicitly update handle positions based on current layout direction
    // This ensures handles are correctly positioned even after worker processing
    const { sourcePosition, targetPosition } = getHandlePositions(layoutConfig.direction);
    const nodesWithCorrectHandles = typedNodes.map((node) => {
      const measured = (node as unknown as { measured?: { width?: number; height?: number } }).measured;
      const result: DependencyNode = {
        ...node,
        sourcePosition,
        targetPosition,
      };
      // Apply measured dimensions to actual width/height so they're available for bounds calculations
      if (measured?.width !== undefined) {
        result.width = measured.width;
      }
      if (measured?.height !== undefined) {
        result.height = measured.height;
      }
      return result;
    });

    // Debug: Check edges after layout processing
    graphLogger.info(`After layout: ${typedEdges.length} edges`);
    if (typedEdges.length > 0) {
      graphLogger.info(
        'Edges still have hidden=false:',
        typedEdges.every((e) => e.hidden === false)
      );
      graphLogger.info('Sample edge after layout:', typedEdges[0]);
    }

    // Minimal post-layout metrics
    const idToBox = new Map<string, { x: number; y: number; w: number; h: number }>();
    nodesWithCorrectHandles.forEach((n) => {
      const measured = (n as unknown as { measured?: { width?: number; height?: number } }).measured;
      const w = measured?.width ?? (typeof n.width === 'number' ? n.width : 150);
      const h = measured?.height ?? (typeof n.height === 'number' ? n.height : 50);
      idToBox.set(n.id, { x: n.position.x, y: n.position.y, w, h });
    });
    // keep stable order to minimize reactivity churn
    let totalLen = 0;
    const outdeg = new Map<string, number>();
    const indeg = new Map<string, number>();
    typedEdges.forEach((e) => {
      outdeg.set(e.source, (outdeg.get(e.source) ?? 0) + 1);
      indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
      const s = idToBox.get(e.source);
      const t = idToBox.get(e.target);
      if (s && t) {
        const sx = s.x + s.w / 2;
        const sy = s.y + s.h / 2;
        const tx = t.x + t.w / 2;
        const ty = t.y + t.h / 2;
        totalLen += Math.abs(sx - tx) + Math.abs(sy - ty);
      }
    });
    const numNodes = nodesWithCorrectHandles.length;
    const numEdges = typedEdges.length;
    const avgOut = numNodes > 0 ? Array.from(outdeg.values()).reduce((a, b) => a + b, 0) / numNodes : 0;
    const avgIn = numNodes > 0 ? Array.from(indeg.values()).reduce((a, b) => a + b, 0) / numNodes : 0;
    graphLogger.info('Layout metrics', {
      nodes: numNodes,
      edges: numEdges,
      avgOutdeg: avgOut,
      avgIndeg: avgIn,
      approxTotalEdgeLength: Math.round(totalLen),
    });

    // Apply smart clustering if enabled
    let finalNodes = nodesWithCorrectHandles;
    let finalEdges = typedEdges;

    if (graphSettings.useSmartClustering) {
      try {
        const { applySmartClustering } = await import('../../graph/cluster/folders');
        const clusteringResult = applySmartClustering(
          finalNodes,
          finalEdges,
          props.data,
          graphSettings.clusteringOptions
        );
        // Ensure all nodes have sourcePosition and targetPosition
        finalNodes = clusteringResult.nodes.map((node) => ({
          ...node,
          sourcePosition: node.sourcePosition ?? sourcePosition,
          targetPosition: node.targetPosition ?? targetPosition,
        }));
        finalEdges = clusteringResult.edges;
        graphLogger.info('Applied smart clustering');
      } catch (err) {
        graphLogger.warn('Smart clustering failed:', err);
      }
    }

    // Apply visual hierarchy if enabled
    if (graphSettings.useVisualHierarchy) {
      try {
        const { applyVisualHierarchy } = await import('../../theme/graphTheme');
        const hierarchyNodes = applyVisualHierarchy(finalNodes, finalEdges, graphSettings.visualHierarchyConfig);
        // Ensure all nodes have sourcePosition and targetPosition
        finalNodes = hierarchyNodes.map((node) => ({
          ...node,
          sourcePosition: node.sourcePosition ?? sourcePosition,
          targetPosition: node.targetPosition ?? targetPosition,
        }));
        graphLogger.info('Applied visual hierarchy');
      } catch (err) {
        graphLogger.warn('Visual hierarchy failed:', err);
      }
    }

    graphLogger.debug('Checking if nodes/edges changed...');

    // Update nodes/edges only if changed to avoid recursive reactivity loops
    if (!areNodesShallowEqual(nodes.value, finalNodes)) {
      graphLogger.debug(`Nodes changed, updating store with ${finalNodes.length} nodes`);
      graphStore.setNodes(finalNodes);

      // Log sample positions to verify layout calculation
      const sampleSize = Math.min(5, finalNodes.length);
      const samplePositions = finalNodes.slice(0, sampleSize).map((n) => ({
        id: n.id.substring(0, 8),
        x: Math.round(n.position.x),
        y: Math.round(n.position.y),
      }));
      graphLogger.info('Sample node positions after layout:', samplePositions);
    } else {
      graphLogger.debug('Nodes unchanged, skipping update');
    }

    if (!areEdgesShallowEqual(edges.value, finalEdges)) {
      graphLogger.debug(`Edges changed, updating store with ${finalEdges.length} edges`);
      graphStore.setEdges(finalEdges);

      // Apply edge visualization
      if (edgeVisualizationEngine.value) {
        graphLogger.debug('Applying edge visualization...');
        enhancedEdges.value = edgeVisualizationEngine.value.visualizeEdges(finalNodes, finalEdges);
        edgeVisualizationEngine.value.startAnimations();
        graphLogger.debug('Edge visualization complete');
      }
    } else {
      graphLogger.debug('Edges unchanged, skipping update');
    }

    // Debug: Verify store state
    graphLogger.debug('Store state after update:', { nodes: nodes.value.length, edges: edges.value.length });

    // Fit view after layout (only if VueFlow is mounted)
    if (isGraphReady.value) {
      graphLogger.debug('Scheduling fitView...');
      await Promise.resolve();
      graphLogger.debug('Calling fitView...');
      await fitView({ duration: 150, padding: 0.1 });
      graphLogger.debug('fitView complete');
    } else {
      graphLogger.debug('Skipping fitView - VueFlow not mounted yet');
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error during layout processing');
    graphLogger.error('Layout processing failed:', error);
    // Potentially update UI to show error state to the user
  } finally {
    // End performance measurement - always executed
    performance.mark(endMark);
    measurePerformance('graph-layout', startMark, endMark);
    isLayoutRunning.value = false;
  }
};

// Progressive rendering phases
// Note: All symbol types can render independently of modules
// They will appear even if modules are disabled, but they still need modules
// to exist in the data structure for proper parent-child relationships
const RENDERING_PHASES = [
  { name: 'classes', level: 2, types: ['class', 'interface', 'type', 'enum', 'function'] },
  { name: 'modules', level: 1, types: ['module'] },
  { name: 'packages', level: 0, types: ['package'] },
] as const;

// Progressive graph initialization
const initializeGraph = async () => {
  // Use unique mark names to avoid conflicts with multiple calls
  const timestamp = Date.now();
  const startMark = `graph-init-start-${timestamp}`;
  const endMark = `graph-init-end-${timestamp}`;

  performance.mark(startMark);

  try {
    // Debug: Check if we have data
    graphLogger.info('Initializing graph with data:', {
      packageCount: props.data?.packages?.size ?? 0,
      packages: Array.from(props.data?.packages?.values() ?? []).map((p) => ({ id: p.id, name: p.name })),
    });

    // Early return if no data
    if (!props.data || !props.data.packages || props.data.packages.size === 0) {
      graphLogger.warn('No data available to create graph');
      graphStore.setNodes([]);
      graphStore.setEdges([]);
      return;
    }

    // Initialize layout processor
    initializeLayoutProcessor();

    // CRITICAL: Unmount VueFlow during initialization to prevent ResizeObserver loops
    // VueFlow will be remounted only after all data is ready
    isGraphReady.value = false;

    // CRITICAL: Set progressive rendering flag BEFORE any node/edge mutations
    // This prevents VueFlow's ResizeObserver from triggering recursive updates
    isProgressiveRendering.value = true;

    // Enable measured dimension feedback for initial layout
    isInitialLayout.value = true;
    hasAppliedMeasuredLayout.value = false;

    // Reset re-entry counter for new initialization
    onNodesInitializedCallCount.value = 0;

    // Clear existing graph (now protected by isProgressiveRendering flag)
    graphStore.setNodes([]);
    graphStore.setEdges([]);

    // Progressive rendering: Add nodes in phases
    await renderGraphProgressively();
  } finally {
    // End performance measurement - always executed
    performance.mark(endMark);
    measurePerformance('graph-initialization', startMark, endMark);
  }
};

// Progressive rendering implementation
const renderGraphProgressively = async () => {
  // Note: isProgressiveRendering flag is already set by initializeGraph
  // We just need to handle cleanup in the finally block
  try {
    // OPTIMIZATION: Instead of adding nodes in phases (which triggers multiple reactive cycles),
    // collect all nodes first, then add them in a single batch to avoid ResizeObserver recursion
    const allNodes: DependencyNode[] = [];

    for (const phase of RENDERING_PHASES) {
      graphLogger.info(`Collecting nodes for phase: ${phase.name}`);

      // Create nodes for this phase
      const phaseNodes = await createNodesForPhase(phase);

      if (phaseNodes.length > 0) {
        allNodes.push(...phaseNodes);
        graphLogger.info(`Collected ${String(phaseNodes.length)} nodes for phase: ${phase.name}`);
      }
    }

    // Add ALL nodes in a single batch to avoid multiple reactive update cycles
    if (allNodes.length > 0) {
      graphLogger.info(`Adding all ${String(allNodes.length)} nodes in single batch`);
      graphStore.addNodes(allNodes);

      // Wait for Vue to render all nodes
      await nextTick();
    }

    // Apply final enhancements (including edge creation and layout)
    await applyFinalEnhancements();
  } finally {
    // Re-enable dimension updates after progressive rendering completes
    isProgressiveRendering.value = false;
    graphLogger.debug('Progressive rendering complete, dimension updates re-enabled');

    // Mount VueFlow now that all data is ready
    isGraphReady.value = true;
    graphLogger.info('Graph data ready, mounting VueFlow component');

    // Wait for VueFlow to fully mount and initialize viewport, then fit view
    await nextTick();
    await nextTick(); // Double nextTick ensures VueFlow viewport is initialized

    try {
      graphLogger.debug('VueFlow mounted, calling initial fitView...');
      await fitView({ duration: 300, padding: 0.1 });
      graphLogger.debug('Initial fitView complete');
    } catch (error) {
      graphLogger.warn('Initial fitView failed:', error);
      // Non-fatal - view just won't auto-fit
    }
  }
};

// Create nodes for a specific phase
const createNodesForPhase = async (phase: (typeof RENDERING_PHASES)[number]): Promise<DependencyNode[]> => {
  const nodes: DependencyNode[] = [];

  graphLogger.debug(`Phase ${phase.name}: checking if should render...`);
  graphLogger.debug(`visibleNodeTypes has:`, Array.from(graphSettings.visibleNodeTypes));
  graphLogger.debug(`phase.types:`, phase.types);

  // Check if this phase should be rendered based on settings
  const shouldRenderPhase = phase.types.some((type) => {
    const hasType = graphSettings.visibleNodeTypes.has(type as DependencyKind);
    graphLogger.debug(`  - checking type '${type}': ${hasType}`);
    return hasType;
  });

  graphLogger.debug(`Phase ${phase.name}: shouldRenderPhase = ${shouldRenderPhase}`);

  if (!shouldRenderPhase) {
    graphLogger.warn(`Skipping phase ${phase.name} - no matching types in visibleNodeTypes`);
    return nodes;
  }

  // Create nodes based on phase
  if (phase.name === 'packages') {
    const graphNodes = createGraphNodes(props.data!, {
      includePackages: true,
      includeClasses: false,
      direction: layoutConfig.direction,
    });
    nodes.push(...graphNodes.filter((node) => node.type === 'package'));
  } else if (phase.name === 'modules') {
    const graphNodes = createGraphNodes(props.data!, {
      includePackages: false,
      includeClasses: false,
      direction: layoutConfig.direction,
      visibleNodeTypes: new Set(['module']),
    });
    nodes.push(...graphNodes.filter((node) => node.type === 'module'));
  } else if (phase.name === 'classes') {
    // For classes/interfaces/types/enums, we conditionally include modules
    // based on whether modules are enabled in the settings
    const visibleTypes = new Set(graphSettings.visibleNodeTypes);
    if (graphSettings.showModules) {
      visibleTypes.add('module');
    }

    const graphNodes = createGraphNodes(props.data!, {
      includePackages: false,
      includeClasses: true,
      direction: layoutConfig.direction,
      visibleNodeTypes: visibleTypes,
    });

    // Filter nodes based on visible types
    const classNodes = graphNodes.filter((node) => node.type === 'class');
    const interfaceNodes = graphNodes.filter((node) => node.type === 'interface');
    const typeNodes = graphNodes.filter((node) => node.type === 'type');
    const enumNodes = graphNodes.filter((node) => node.type === 'enum');
    const functionNodes = graphNodes.filter((node) => node.type === 'function');
    const moduleNodes = graphNodes.filter((node) => node.type === 'module');

    // Combine all nodes for this phase
    nodes.push(...moduleNodes, ...classNodes, ...interfaceNodes, ...typeNodes, ...enumNodes, ...functionNodes);
  }

  return nodes;
};

// Apply final enhancements
const applyFinalEnhancements = async () => {
  const currentNodes = graphStore.nodes;

  if (currentNodes.length === 0) return;

  graphLogger.info('Applying final enhancements...');

  // Create ALL edges now that all nodes are visible
  graphLogger.info('Creating edges for all visible nodes...');
  const allGraphEdges = createGraphEdges(props.data!) as unknown as GraphEdge[];

  // Get all currently visible node IDs
  const visibleNodeIds = new Set(currentNodes.map((node) => node.id));

  // Get enabled relationship types for filtering
  const enabledTypes = new Set(graphSettings.enabledRelationshipTypes);

  // Filter edges to only include those connecting visible nodes with enabled relationship types
  const edgeTypeStats = new Map<string, { total: number; filtered: number; reasonHidden: string[] }>();

  const filteredEdges = allGraphEdges.filter((edge) => {
    const edgeType = edge.data?.type ?? 'dependency';

    // Initialize stats for this edge type
    if (!edgeTypeStats.has(edgeType)) {
      edgeTypeStats.set(edgeType, { total: 0, filtered: 0, reasonHidden: [] });
    }
    const stats = edgeTypeStats.get(edgeType)!;
    stats.total++;

    // Check if both nodes are visible
    const bothNodesVisible = visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
    if (!bothNodesVisible) {
      stats.reasonHidden.push(`nodes_not_visible(${edge.source}->${edge.target})`);
      return false;
    }

    // Check if relationship type is enabled
    const typeEnabled = enabledTypes.has(edgeType);
    if (!typeEnabled) {
      stats.reasonHidden.push(`type_disabled`);
      return false;
    }

    stats.filtered++;
    return true;
  });

  graphLogger.info(`Created ${filteredEdges.length} edges (filtered from ${allGraphEdges.length} total)`);

  // Log detailed stats for each edge type
  edgeTypeStats.forEach((stats, type) => {
    if (stats.total > 0) {
      const hiddenCount = stats.total - stats.filtered;
      graphLogger.info(`  ${type}: ${stats.filtered}/${stats.total} visible${hiddenCount > 0 ? ` (${hiddenCount} hidden: ${stats.reasonHidden.slice(0, 3).join(', ')}${stats.reasonHidden.length > 3 ? '...' : ''})` : ''}`);
    }
  });

  // Track processed nodes and edges through enhancement pipeline
  let processedNodes = currentNodes;
  let processedEdges = filteredEdges;

  // Apply smart clustering if enabled
  if (graphSettings.useSmartClustering) {
    try {
      const { applySmartClustering } = await import('../../graph/cluster/folders');
      const clusteringResult = applySmartClustering(
        processedNodes,
        processedEdges,
        props.data!,
        graphSettings.clusteringOptions
      );
      processedNodes = clusteringResult.nodes;
      processedEdges = clusteringResult.edges;
      graphLogger.info('Applied smart clustering');
    } catch (err) {
      graphLogger.warn('Smart clustering failed:', err);
    }
  }

  // Apply visual hierarchy if enabled
  if (graphSettings.useVisualHierarchy) {
    try {
      const { applyVisualHierarchy } = await import('../../theme/graphTheme');
      processedNodes = applyVisualHierarchy(processedNodes, processedEdges, graphSettings.visualHierarchyConfig);
      graphLogger.info('Applied visual hierarchy');
    } catch (err) {
      graphLogger.warn('Visual hierarchy failed:', err);
    }
  }

  // Run final layout with edges - this will add nodes THEN edges to the store
  graphLogger.info('Running final layout with edges...');
  await processGraphLayout({
    nodes: processedNodes,
    edges: processedEdges,
  });

  // Fit view to final graph (only if VueFlow is mounted)
  if (isGraphReady.value) {
    await fitView({ duration: 300, padding: 0.1 });
    graphLogger.debug('Final fitView complete');
  } else {
    graphLogger.debug('Skipping final fitView - will be called after VueFlow mounts');
  }

  graphLogger.info('Final enhancements complete');
};

// Watch for data changes
watch(() => props.data, initializeGraph, { immediate: true });

// Watch for enhanced layout settings changes
watch(
  () => [
    graphSettings.useMultiAlgorithm,
    graphSettings.layoutStrategy,
    graphSettings.forceDirectedConfig,
    graphSettings.gridConfig,
  ],
  () => {
    initializeLayoutProcessor();
    void initializeGraph();
  },
  { deep: true }
);

// Watch for clustering settings changes
watch(
  () => [graphSettings.useSmartClustering, graphSettings.clusteringOptions],
  () => {
    void initializeGraph();
  },
  { deep: true }
);

// Watch for visual hierarchy settings changes
watch(
  () => [graphSettings.useVisualHierarchy, graphSettings.visualHierarchyConfig],
  () => {
    void initializeGraph();
  },
  { deep: true }
);

// Single click handler - highlight connected nodes
const onNodeClick = ({ node }: { node: unknown }): void => {
  const clickedNode = node as DependencyNode;
  graphStore.setSelectedNode(clickedNode);

  // Calculate connected nodes locally to avoid reactive loops
  // We get a snapshot of edges at this moment
  const edgesSnapshot = edges.value;
  const connected = new Set<string>([clickedNode.id]);

  edgesSnapshot.forEach((edge: GraphEdge) => {
    if (edge.source === clickedNode.id) {
      connected.add(edge.target);
    } else if (edge.target === clickedNode.id) {
      connected.add(edge.source);
    }
  });

  // Update nodes with highlighting
  graphStore.setNodes(
    nodes.value.map((n: DependencyNode) => {
      const isConnected = connected.has(n.id);
      const isClicked = n.id === clickedNode.id;

      return {
        ...n,
        style: {
          ...getNodeStyle(n.type as DependencyKind),
          opacity: isConnected ? 1 : 0.3,
          borderWidth: isClicked ? '3px' : isConnected ? '2px' : '1px',
          borderColor: isClicked ? '#00ffff' : isConnected ? '#61dafb' : undefined,
        },
      };
    })
  );

  // Update edges with highlighting
  graphStore.setEdges(
    edges.value.map((edge: GraphEdge) => {
      const isConnected = edge.source === clickedNode.id || edge.target === clickedNode.id;

      return {
        ...edge,
        style: {
          ...getEdgeStyle(toDependencyEdgeKind(edge.data?.type)),
          opacity: isConnected ? 1 : 0.2,
          strokeWidth: isConnected ? 3 : 1,
        },
        animated: isConnected,
      };
    })
  );
};

// Double click handler - show detailed view
const onNodeDoubleClick = async ({ node }: { node: unknown }): Promise<void> => {
  const selectedNode = node as DependencyNode;
  graphStore.setSelectedNode(selectedNode);

  // If it's a module node, show its internal structure
  if (selectedNode.type === 'module') {
    graphLogger.info(`Expanding module view: ${selectedNode.data?.label}`);

    // Create detailed nodes for this module from the original data
    const moduleData = Array.from(props.data.packages.values())
      .flatMap((pkg) => Object.values(pkg.modules || {}))
      .find((m) => m.id === selectedNode.id);

    if (!moduleData) {
      graphLogger.warn('Could not find module data');
      return;
    }

    const detailedNodes: DependencyNode[] = [];
    const detailedEdges: GraphEdge[] = [];

    // Get handle positions based on current layout direction
    const { sourcePosition, targetPosition } = getHandlePositions(layoutConfig.direction);

    // Add the module node itself
    detailedNodes.push({
      ...selectedNode,
      sourcePosition,
      targetPosition,
      style: {
        ...selectedNode.style,
        borderWidth: '3px',
        borderColor: '#00ffff',
      },
    });

    // Add all classes in this module
    if (moduleData.classes) {
      mapTypeCollection<Class, void>(moduleData.classes, (cls) => {
        const properties = cls.properties
          ? Object.values(cls.properties).map((p) => ({
              name: p.name,
              type: p.type,
              visibility: p.visibility,
            }))
          : [];

        const methods = cls.methods
          ? Object.values(cls.methods).map((m) => ({
              name: m.name,
              returnType: m.returnType,
              visibility: m.visibility,
              signature: m.signature || `${m.name}(): ${m.returnType}`,
            }))
          : [];

        detailedNodes.push({
          id: cls.id,
          type: 'class' as DependencyKind,
          position: { x: 0, y: 0 },
          sourcePosition,
          targetPosition,
          data: {
            label: cls.name,
            properties,
            methods,
          },
          style: {
            ...getNodeStyle('class'),
            borderColor: '#4caf50',
          },
        });

        // Add inheritance edge if exists
        if (cls.extends_id) {
          detailedEdges.push({
            id: `${cls.id}-${cls.extends_id}-inheritance`,
            source: cls.id,
            target: cls.extends_id,
            hidden: false,
            data: { type: 'inheritance' as DependencyEdgeKind },
            style: { ...getEdgeStyle('inheritance'), strokeWidth: 3 },
            markerEnd: { type: MarkerType.ArrowClosed },
          } as GraphEdge);
        }

        // Add implementation edges
        if (cls.implemented_interfaces) {
          Object.values(cls.implemented_interfaces).forEach((iface) => {
            if (iface.id) {
              detailedEdges.push({
                id: `${cls.id}-${iface.id}-implements`,
                source: cls.id,
                target: iface.id,
                hidden: false,
                data: { type: 'implements' as DependencyEdgeKind },
                style: { ...getEdgeStyle('implements'), strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed },
              } as GraphEdge);
            }
          });
        }
      });
    }

    // Add all interfaces in this module
    if (moduleData.interfaces) {
      mapTypeCollection<Interface, void>(moduleData.interfaces, (iface) => {
        const properties = iface.properties
          ? Object.values(iface.properties).map((p) => ({
              name: p.name,
              type: p.type,
              visibility: p.visibility,
            }))
          : [];

        const methods = iface.methods
          ? Object.values(iface.methods).map((m) => ({
              name: m.name,
              returnType: m.returnType,
              visibility: m.visibility,
              signature: m.signature || `${m.name}(): ${m.returnType}`,
            }))
          : [];

        detailedNodes.push({
          id: iface.id,
          type: 'interface' as DependencyKind,
          position: { x: 0, y: 0 },
          sourcePosition,
          targetPosition,
          data: {
            label: iface.name,
            properties,
            methods,
          },
          style: {
            ...getNodeStyle('interface'),
            borderColor: '#ff9800',
          },
        });

        // Add interface inheritance edges
        if (iface.extended_interfaces) {
          Object.values(iface.extended_interfaces).forEach((extended) => {
            if (extended.id) {
              detailedEdges.push({
                id: `${iface.id}-${extended.id}-inheritance`,
                source: iface.id,
                target: extended.id,
                hidden: false,
                data: { type: 'inheritance' as DependencyEdgeKind },
                style: { ...getEdgeStyle('inheritance'), strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed },
              } as GraphEdge);
            }
          });
        }
      });
    }

    // Add connected modules (imports)
    const connectedModuleIds = new Set<string>();
    edges.value.forEach((edge: GraphEdge) => {
      if (edge.source === selectedNode.id) {
        connectedModuleIds.add(edge.target);
        detailedEdges.push({
          ...edge,
          style: { ...edge.style, stroke: '#61dafb', strokeWidth: 3 },
          animated: true,
        } as GraphEdge);
      } else if (edge.target === selectedNode.id) {
        connectedModuleIds.add(edge.source);
        detailedEdges.push({
          ...edge,
          style: { ...edge.style, stroke: '#ffd700', strokeWidth: 3 },
          animated: true,
        } as GraphEdge);
      }
    });

    // Add connected module nodes
    connectedModuleIds.forEach((moduleId) => {
      const connectedModule = nodes.value.find((n: DependencyNode) => n.id === moduleId);
      if (connectedModule) {
        detailedNodes.push({
          ...connectedModule,
          sourcePosition,
          targetPosition,
          style: {
            ...connectedModule.style,
            borderWidth: '2px',
            borderColor: '#61dafb',
          },
        });
      }
    });

    graphLogger.info(
      `Showing ${detailedNodes.length} nodes (${detailedNodes.filter((n) => n.type === 'class').length} classes, ${detailedNodes.filter((n) => n.type === 'interface').length} interfaces) and ${detailedEdges.length} edges`
    );

    // Trigger re-layout with detailed subgraph (guard re-entrancy)
    if (!isLayoutRunning.value) {
      await processGraphLayout({
        nodes: detailedNodes,
        edges: detailedEdges,
      });
    }

    // Fit view to the detailed subgraph
    await fitView({
      duration: 300,
      padding: 0.2,
    });
  } else {
    // For non-module nodes, just show connections
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

    if (!isLayoutRunning.value) {
      await processGraphLayout({
        nodes: focusedNodes,
        edges: focusedEdges,
      });
    }

    await fitView({
      duration: 300,
      padding: 0.3,
      nodes: Array.from(connectedNodeIds),
    });
  }
};

// Pane click handler to deselect and restore full graph
const onPaneClick = (): void => {
  graphStore.setSelectedNode(null);

  graphLogger.info('Clearing selection, restoring default styling');

  // Reset node styles to default (remove highlighting)
  graphStore.setNodes(
    nodes.value.map((node: DependencyNode) => ({
      ...node,
      selected: false,
      style: {
        ...getNodeStyle(node.type as DependencyKind),
        opacity: 1,
        borderWidth: '1px',
      },
    }))
  );

  // Reset edge styles to default
  graphStore.setEdges(
    edges.value.map((edge: GraphEdge) => ({
      ...edge,
      selected: false,
      animated: false,
      style: {
        ...getEdgeStyle(toDependencyEdgeKind(edge.data?.type)),
        opacity: 1,
        strokeWidth: 1,
      },
    }))
  );
};

// Node drag handler - resize parent nodes when children are moved
const onNodeDrag = async ({ node }: { node: unknown }): Promise<void> => {
  const draggedNode = node as DependencyNode;

  // Check if the dragged node has a parent
  if (!draggedNode.parentNode) {
    return;
  }

  graphLogger.debug(`Node dragged: ${draggedNode.id}, parent: ${draggedNode.parentNode}`);

  // Calculate new bounds for the parent
  // Use content-only bounds (exclude node header) when resizing parent containers
  const { calculateParentNodeContentBounds } = await import('../../utils/calculateParentBounds');
  const newBounds = calculateParentNodeContentBounds(draggedNode.parentNode, nodes.value, 20, 32);

  if (!newBounds) {
    return;
  }

  // Find the parent node
  const parentNode = nodes.value.find((n) => n.id === draggedNode.parentNode);
  if (!parentNode) {
    return;
  }

  // Check if the parent actually needs to be resized
  const currentWidth = typeof parentNode.width === 'number' ? parentNode.width : 0;
  const currentHeight = typeof parentNode.height === 'number' ? parentNode.height : 0;

  if (Math.abs(currentWidth - newBounds.width) < 1 && Math.abs(currentHeight - newBounds.height) < 1) {
    // No significant change, skip update
    return;
  }

  graphLogger.debug(
    `Resizing parent ${draggedNode.parentNode}: ${currentWidth}x${currentHeight} -> ${newBounds.width}x${newBounds.height}`
  );

  // Update the parent node's dimensions
  updateNode(draggedNode.parentNode, {
    width: newBounds.width,
    height: newBounds.height,
  });

  // Trigger VueFlow to recalculate internals
  updateNodeInternals([draggedNode.parentNode]);
};

// Filter handler for relationship types
const handleRelationshipFilterChange = async (_types: string[]) => {
  // Relationship types are already updated in graphSettings by GraphControls
  // Reinitialize the graph to apply the new filters
  await initializeGraph();
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

  // Re-run layout with updated configuration if not running
  if (!isLayoutRunning.value) {
    await initializeGraph();
  } else {
    graphLogger.debug('Skipped layout change re-layout because a layout is already running');
  }
};

// Node visibility change handler
const handleNodeVisibilityChange = async () => {
  // Re-initialize graph when node visibility changes
  await initializeGraph();
};

// Search result handler
const handleSearchResult = (result: SearchResult) => {
  // Update node styling based on search results
  graphStore.setNodes(
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
  graphStore.setEdges(
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
    graphStore.setNodes(
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
          graphStore.setSelectedNode(nextNode);
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
  <div class="graph-container h-full w-full" role="application" aria-label="TypeScript dependency graph visualization">
    <!-- Use a standard button for keyboard controls instead of a non-interactive div -->
    <button
      class="visualization-keyboard-control h-full w-full outline-none bg-transparent border-none p-0 cursor-default text-left"
      @keydown="handleKeyDown"
      aria-label="Press arrowclosed keys to navigate between connected nodes"
    >
      <!-- The actual graph -->
      <VueFlow
        v-if="isGraphReady"
        :nodes="nodes"
        :edges="edges"
        :node-types="nodeTypes as any"
        :fit-view-on-init="true"
        :min-zoom="0.1"
        :max-zoom="2"
        :default-viewport="{ x: 0, y: 0, zoom: 0.5 }"
        :translate-extent="graphExtents.translate"
        :node-extent="graphExtents.node"
        :snap-to-grid="true"
        :snap-grid="[15, 15]"
        :pan-on-scroll="true"
        :zoom-on-scroll="true"
        :zoom-on-pinch="true"
        :pan-on-scroll-mode="PanOnScrollMode.Free"
        :zoom-on-double-click="false"
        :elevate-edges-on-select="true"
        :default-edge-options="{
          style: { stroke: '#61dafb', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed },
          type: 'step',
        }"
        @node-click="onNodeClick"
        @node-double-click="onNodeDoubleClick"
        @node-drag="onNodeDrag"
        @pane-click="onPaneClick"
      >
        <Background />
        <GraphControls
          @relationship-filter-change="handleRelationshipFilterChange"
          @layout-change="handleLayoutChange"
          @node-visibility-change="handleNodeVisibilityChange"
          @enhanced-layout-change="
            () => {
              void initializeGraph();
            }
          "
          @clustering-change="
            () => {
              void initializeGraph();
            }
          "
          @visual-hierarchy-change="
            () => {
              void initializeGraph();
            }
          "
          @toggle-show-packages="() => void initializeGraph()"
          @toggle-show-modules="() => void initializeGraph()"
          @toggle-show-classes="() => void initializeGraph()"
          @toggle-show-interfaces="() => void initializeGraph()"
          @toggle-show-types="() => void initializeGraph()"
          @toggle-show-enums="() => void initializeGraph()"
          @toggle-show-functions="() => void initializeGraph()"
          @toggle-cluster-folder="() => void initializeGraph()"
        />
        <GraphSearch @search-result="handleSearchResult" :nodes="nodes" :edges="edges" />
        <NodeDetails v-if="selectedNode" :node="selectedNode" />

        <!-- Analytics Dashboard -->
        <AnalyticsDashboard :nodes="nodes" :edges="edges" :config="DEFAULT_ANALYTICS_CONFIG" />

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

<style scoped>
@import 'tailwindcss';

/* Prevent browser zoom on pinch gestures - let VueFlow handle it */
.graph-container {
  @apply select-none;
  touch-action: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

/* Ensure VueFlow container also prevents browser gestures */
.graph-container :deep(.vue-flow) {
  touch-action: none;
}

/* Prevent zoom on all child elements */
.graph-container :deep(*) {
  touch-action: none;
}
</style>
