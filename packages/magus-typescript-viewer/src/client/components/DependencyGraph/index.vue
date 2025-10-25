<script setup lang="ts">
import { Background } from '@vue-flow/background';
import { MarkerType, PanOnScrollMode, Panel, Position, VueFlow, useVueFlow } from '@vue-flow/core';
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';

import { createLogger } from '../../../shared/utils/logger';
import { DEFAULT_ANALYTICS_CONFIG } from '../../analytics/graphAnalytics';
import { clusterByFolder } from '../../graph/cluster/folders';
import { WebWorkerLayoutProcessor } from '../../layout/WebWorkerLayoutProcessor';
import { useGraphSettings } from '../../stores/graphSettings';
import { useGraphStore } from '../../stores/graphStore';
import { getEdgeStyle, getNodeStyle, graphTheme } from '../../theme/graphTheme';
import { createGraphEdges } from '../../utils/createGraphEdges';
import { createGraphNodes } from '../../utils/createGraphNodes';
import { detectCycles } from '../../utils/graphCycles';
import { measurePerformance } from '../../utils/performanceMonitoring';
import { DEFAULT_EDGE_CONFIG, EdgeVisualizationEngine } from '../../visualization/edgeVisualization';
import AnalyticsDashboard from '../AnalyticsDashboard.vue';
import EnhancedEdge from '../EnhancedEdge.vue';
import GraphControls from './components/GraphControls.vue';
import GraphSearch from './components/GraphSearch.vue';
import NodeDetails from './components/NodeDetails.vue';
import { mapTypeCollection } from './mapTypeCollection';
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
const graphSettings = useGraphSettings();
const { nodes, edges, selectedNode } = storeToRefs(graphStore);

const { fitView, getNodes } = useVueFlow();

// Keep a reference to the layout processor for cleanup
const layoutProcessor = shallowRef<WebWorkerLayoutProcessor | null>(null);

// Track layout state to prevent infinite loops - use refs for reactivity
const isInitialLayout = ref(false);
const hasAppliedMeasuredLayout = ref(false);
const isLayoutRunning = ref(false);

// Edge visualization engine
const edgeVisualizationEngine = ref<EdgeVisualizationEngine | null>(null);
const enhancedEdges = ref<EnhancedEdge[]>([]);

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
const nodeIdsSet = computed(() => new Set(nodes.value.map((n) => n.id)));

// Computed: Dynamic graph extents based on actual node positions + padding
const graphExtents = computed(() => {
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

    // Use actual node dimensions if available, minimal estimate otherwise
    // These small values will be replaced once VueFlow measures the actual content
    const width = typeof node.width === 'number' ? node.width : 50;
    const height = typeof node.height === 'number' ? node.height : 30;

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
});

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

// Handler for when VueFlow nodes are initialized and measured
const onNodesInitialized = async () => {
  // Only run on initial layout, and only once
  if (!isInitialLayout.value || hasAppliedMeasuredLayout.value) {
    return;
  }

  graphLogger.info('Nodes initialized, collecting measured dimensions...');

  // Get measured dimensions from VueFlow - use shallow access for performance
  const vueFlowNodes = getNodes.value;
  const newDimensions = new Map<string, { width: number; height: number }>();

  // Only collect dimensions that have changed
  let hasNewDimensions = false;

  vueFlowNodes.forEach((node) => {
    if (node.dimensions?.width && node.dimensions?.height) {
      const existing = measuredDimensions.value.get(node.id);
      const newDims = {
        width: node.dimensions.width,
        height: node.dimensions.height,
      };

      // Only add if dimensions changed or are new
      if (!existing || existing.width !== newDims.width || existing.height !== newDims.height) {
        newDimensions.set(node.id, newDims);
        hasNewDimensions = true;
        graphLogger.debug(`Node ${node.id} measured: ${newDims.width}x${newDims.height}`);
      } else {
        newDimensions.set(node.id, existing);
      }
    }
  });

  // Only proceed if we have new dimensions
  if (!hasNewDimensions && measuredDimensions.value.size > 0) {
    graphLogger.info('No dimension changes, skipping re-layout');
    hasAppliedMeasuredLayout.value = true;
    isInitialLayout.value = false;
    return;
  }

  graphLogger.info(
    `Collected ${newDimensions.size} node dimensions (${hasNewDimensions ? 'with changes' : 'no changes'})`
  );

  // Now re-run layout with measured dimensions
  if (newDimensions.size > 0) {
    // Mark that we're applying measured layout to prevent infinite loop
    hasAppliedMeasuredLayout.value = true;
    isInitialLayout.value = false;

    // Store memoized dimensions
    measuredDimensions.value = newDimensions;

    // Add measured dimensions to nodes - avoid full map if possible
    const nodesWithDimensions = nodes.value.map((node) => {
      const dims = newDimensions.get(node.id);
      if (dims) {
        return {
          ...node,
          measured: dims,
        };
      }
      return node;
    });

    if (!isLayoutRunning.value) {
      await processGraphLayout({ nodes: nodesWithDimensions, edges: edges.value });
    } else {
      graphLogger.debug('Skipped measured re-layout because a layout is already running');
    }
  }
};

// Process graph layout using web worker
const processGraphLayout = async (graphData: { nodes: DependencyNode[]; edges: GraphEdge[] }) => {
  if (!layoutProcessor.value) return;
  if (isLayoutRunning.value) return;
  isLayoutRunning.value = true;

  // Use unique mark names to avoid conflicts with multiple calls
  const timestamp = Date.now();
  const startMark = `layout-start-${timestamp}`;
  const endMark = `layout-end-${timestamp}`;

  performance.mark(startMark);

  try {
    // Process layout using the web worker
    const result = await layoutProcessor.value.processLayout(graphData);

    // Force the correct types for nodes and edges
    const typedNodes = result.nodes as unknown as DependencyNode[];
    const typedEdges = result.edges as unknown as GraphEdge[];

    // Explicitly update handle positions based on current layout direction
    // This ensures handles are correctly positioned even after worker processing
    const { sourcePosition, targetPosition } = getHandlePositions(layoutConfig.direction);
    const nodesWithCorrectHandles = typedNodes.map((node) => ({
      ...node,
      sourcePosition,
      targetPosition,
    }));

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
        finalNodes = clusteringResult.nodes;
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
        finalNodes = applyVisualHierarchy(finalNodes, finalEdges, graphSettings.visualHierarchyConfig);
        graphLogger.info('Applied visual hierarchy');
      } catch (err) {
        graphLogger.warn('Visual hierarchy failed:', err);
      }
    }

    // Update nodes/edges only if changed to avoid recursive reactivity loops
    if (!areNodesShallowEqual(nodes.value, finalNodes)) {
      graphStore.setNodes(finalNodes);
    }
    if (!areEdgesShallowEqual(edges.value, finalEdges)) {
      graphStore.setEdges(finalEdges);

      // Apply edge visualization
      if (edgeVisualizationEngine.value) {
        enhancedEdges.value = edgeVisualizationEngine.value.visualizeEdges(finalNodes, finalEdges);
        edgeVisualizationEngine.value.startAnimations();
      }
    }

    // Debug: Verify store state
    graphLogger.info('Store edges count:', edges.value.length);

    // Fit view after layout with faster animation (schedule microtask to avoid sync reactivity loop)
    await Promise.resolve();
    await fitView({ duration: 150, padding: 0.1 });
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
  { name: 'packages', level: 0, types: ['package'] },
  { name: 'modules', level: 1, types: ['module'] },
  { name: 'classes', level: 2, types: ['class', 'interface', 'type', 'enum', 'function'] },
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

    // Clear existing graph
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
  const { addNodes, addEdges, fitView } = useVueFlow();

  for (const phase of RENDERING_PHASES) {
    graphLogger.info(`Starting rendering phase: ${phase.name}`);

    // Create nodes for this phase
    const phaseNodes = await createNodesForPhase(phase);
    const phaseEdges = await createEdgesForPhase(phase);

    if (phaseNodes.length > 0) {
      // Add nodes to VueFlow
      addNodes(phaseNodes);

      // Update the Pinia store for analytics
      graphStore.addNodes(phaseNodes);

      // Add edges if any
      if (phaseEdges.length > 0) {
        addEdges(phaseEdges);
        graphStore.addEdges(phaseEdges);
      }

      // Run layout after each phase for proper progressive rendering
      await processGraphLayout({
        nodes: graphStore.nodes,
        edges: graphStore.edges,
      });

      // Fit view to show new nodes
      await fitView({ duration: 300, padding: 0.1 });

      // Wait for animations to complete
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    graphLogger.info(`Completed rendering phase: ${phase.name} (${String(phaseNodes.length)} nodes)`);
  }

  // Apply final enhancements
  await applyFinalEnhancements();
};

// Create nodes for a specific phase
const createNodesForPhase = async (phase: (typeof RENDERING_PHASES)[0]): Promise<DependencyNode[]> => {
  const nodes: DependencyNode[] = [];

  // Check if this phase should be rendered based on settings
  const shouldRenderPhase = phase.types.some((type) => {
    return graphSettings.visibleNodeTypes.has(type as DependencyKind);
  });

  if (!shouldRenderPhase) {
    return nodes;
  }

  // Create nodes based on phase
  if (phase.name === 'packages') {
    const graphNodes = createGraphNodes(props.data!, {
      includePackages: true,
      includeClasses: false,
      direction: layoutConfig.direction,
      visibleNodeTypes: undefined,
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

// Create edges for a specific phase
const createEdgesForPhase = async (phase: (typeof RENDERING_PHASES)[0]): Promise<GraphEdge[]> => {
  const edges: GraphEdge[] = [];

  // Create ALL edges (we'll filter by phase type and visible nodes)
  const allGraphEdges = createGraphEdges(props.data!) as unknown as GraphEdge[];

  // Get all currently visible node IDs from the graph store
  const visibleNodeIds = new Set(graphStore.nodes.map((node) => node.id));

  // Get enabled relationship types for filtering
  const enabledTypes = new Set(graphSettings.enabledRelationshipTypes);

  // Filter edges based on phase, visible nodes, and relationship types
  const filteredEdges = allGraphEdges.filter((edge) => {
    // Check if both nodes are visible
    const bothNodesVisible = visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
    if (!bothNodesVisible) return false;

    // Check if relationship type is enabled
    const edgeType = edge.data?.type ?? 'dependency';
    const typeEnabled = enabledTypes.has(edgeType);
    if (!typeEnabled) return false;

    // Phase-specific filtering
    if (phase.name === 'packages') {
      // Only include package dependency edges
      return edgeType === 'dependency' || edgeType === 'devDependency' || edgeType === 'peerDependency';
    } else if (phase.name === 'modules') {
      // Only include module import/export edges
      return edgeType === 'import' || edgeType === 'export';
    } else if (phase.name === 'classes') {
      // Include class/interface relationship edges
      return edgeType === 'inheritance' || edgeType === 'implements' || edgeType === 'extends';
    }

    return false;
  });

  edges.push(...filteredEdges);

  return edges;
};

// Apply layout for a specific phase
const applyLayoutForPhase = async (
  phase: (typeof RENDERING_PHASES)[0],
  nodes: DependencyNode[],
  edges: GraphEdge[]
) => {
  if (nodes.length === 0) return;

  // Use different layout strategies based on phase
  let layoutConfig = {
    direction: graphSettings.layoutDirection,
    nodeSpacing: graphSettings.nodeSpacing,
    rankSpacing: graphSettings.rankSpacing,
    edgeSpacing: 50,
  };

  // Adjust layout based on phase
  if (phase.name === 'packages') {
    // Use hierarchical layout for packages
    layoutConfig.rankSpacing = 300;
  } else if (phase.name === 'modules') {
    // Use tighter spacing for modules
    layoutConfig.nodeSpacing = 100;
    layoutConfig.rankSpacing = 200;
  } else if (phase.name === 'classes') {
    // Use grid layout for classes
    layoutConfig.nodeSpacing = 80;
    layoutConfig.rankSpacing = 150;
  }

  // Apply layout using web worker
  await processGraphLayout({ nodes, edges });
};

// Apply final enhancements
const applyFinalEnhancements = async () => {
  const currentNodes = graphStore.nodes;
  const currentEdges = graphStore.edges;

  if (currentNodes.length === 0) return;

  // Apply smart clustering if enabled
  if (graphSettings.useSmartClustering) {
    try {
      const { applySmartClustering } = await import('../../graph/cluster/folders');
      const clusteringResult = applySmartClustering(
        currentNodes,
        currentEdges,
        props.data!,
        graphSettings.clusteringOptions
      );
      graphStore.setNodes(clusteringResult.nodes);
      graphStore.setEdges(clusteringResult.edges);
      graphLogger.info('Applied smart clustering');
    } catch (err) {
      graphLogger.warn('Smart clustering failed:', err);
    }
  }

  // Apply visual hierarchy if enabled
  if (graphSettings.useVisualHierarchy) {
    try {
      const { applyVisualHierarchy } = await import('../../theme/graphTheme');
      const enhancedNodes = applyVisualHierarchy(
        graphStore.nodes,
        graphStore.edges,
        graphSettings.visualHierarchyConfig
      );
      graphStore.setNodes(enhancedNodes);
      graphLogger.info('Applied visual hierarchy');
    } catch (err) {
      graphLogger.warn('Visual hierarchy failed:', err);
    }
  }
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
    const moduleData = props.data.packages
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
      mapTypeCollection(moduleData.classes, (cls) => {
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
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
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
                markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
              } as GraphEdge);
            }
          });
        }
      });
    }

    // Add all interfaces in this module
    if (moduleData.interfaces) {
      mapTypeCollection(moduleData.interfaces, (iface) => {
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
                markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
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
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
          type: 'step',
        }"
        @node-click="onNodeClick"
        @node-double-click="onNodeDoubleClick"
        @pane-click="onPaneClick"
        @nodes-initialized="onNodesInitialized"
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
/* Prevent browser zoom on pinch gestures - let VueFlow handle it */
.graph-container {
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  /* Prevent iOS Safari double-tap zoom */
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

/* Allow text selection within nodes if needed */
.graph-container :deep(.vue-flow__node) {
  -webkit-user-select: text;
  user-select: text;
}
</style>
