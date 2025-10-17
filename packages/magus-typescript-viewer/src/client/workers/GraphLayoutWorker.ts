/**
 * Web Worker for handling complex graph layout calculations
 * This offloads CPU-intensive operations from the main thread
 */

import type { Edge } from '@vue-flow/core';

import type { DependencyNode } from '../components/DependencyGraph/types';
import type { GraphTheme } from '../theme/graphTheme';

// Worker message types
interface WorkerMessage {
  type: 'process-layout';
  payload: {
    nodes: DependencyNode[];
    edges: Edge[];
    config: LayoutConfig;
  };
}

interface LayoutConfig {
  direction: 'DOWN' | 'UP' | 'RIGHT' | 'LEFT';
  nodesep: number;
  edgesep: number;
  ranksep: number;
  theme: GraphTheme;
  animationDuration?: number;
}

// Handle messages from the main thread using ELK layered layout
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { nodes, edges, config } = event.data.payload;

  try {
    // Import ELK API (will spawn its own worker)
    const { default: ELK } = await import('elkjs/lib/elk-api.js');

    // Create ELK instance with worker URL (allows ELK to spawn subworker)
    // Use new URL() for proper Vite bundling
    const workerUrl = new URL('elkjs/lib/elk-worker.min.js', import.meta.url).href;
    const elk = new ELK({
      workerUrl,
    });

    const defaultWidth = 200;
    const defaultHeight = 120;

    // Define ELK node type
    interface ElkNode {
      id: string;
      width: number;
      height: number;
      x?: number;
      y?: number;
      children?: ElkNode[];
      layoutOptions?: Record<string, string>;
    }

    // Map VueFlow directions to ELK's expected values
    const directionMap: Record<string, string> = {
      RIGHT: 'RIGHT',
      LEFT: 'LEFT',
      DOWN: 'DOWN',
      UP: 'UP',
    };
    const elkDirection = directionMap[config.direction] ?? 'RIGHT';

    // Build hierarchical structure for ELK
    const nodeMap = new Map<string, ElkNode>();
    const rootNodes: ElkNode[] = [];

    // First pass: create all nodes
    nodes.forEach((node) => {
      const nodeWidth = (node as unknown as { measured?: { width?: number } }).measured?.width ?? defaultWidth;
      const nodeHeight = (node as unknown as { measured?: { height?: number } }).measured?.height ?? defaultHeight;

      const elkNode: ElkNode = {
        id: node.id,
        width: nodeWidth,
        height: nodeHeight,
        children: [],
      };
      nodeMap.set(node.id, elkNode);
    });

    // Add layout options to nodes that will have children
    nodeMap.forEach((elkNode) => {
      // Check if this node will have children
      const hasChildren = nodes.some((n) => (n as unknown as { parentNode?: string }).parentNode === elkNode.id);
      if (hasChildren) {
        elkNode.layoutOptions = {
          'elk.algorithm': 'layered',
          'elk.direction': elkDirection,
          'elk.padding': '[top=30,left=30,bottom=30,right=30]',
          'elk.spacing.nodeNode': '20',
          'elk.layered.spacing.nodeNodeBetweenLayers': '30',
        };
      }
    });

    // Second pass: build hierarchy based on parentNode
    nodes.forEach((node) => {
      const elkNode = nodeMap.get(node.id);
      if (!elkNode) return;

      const parentNodeId = (node as unknown as { parentNode?: string }).parentNode;
      if (parentNodeId) {
        const parent = nodeMap.get(parentNodeId);
        if (parent) {
          parent.children = parent.children ?? [];
          parent.children.push(elkNode);
        }
      } else {
        rootNodes.push(elkNode);
      }
    });

    // Filter edges to only include valid connections
    // Containment is now handled by hierarchy, not edges
    const validEdges = edges.filter((edge) => {
      return nodes.some((n) => n.id === edge.source) && nodes.some((n) => n.id === edge.target);
    });

    // Define ELK edge type - ELK uses sources/targets arrays
    interface ElkEdge {
      id: string;
      sources: string[];
      targets: string[];
    }

    // Create ELK edges with correct format
    const elkEdges: ElkEdge[] = validEdges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    }));

    // Define ELK graph type
    interface ElkGraph {
      id: string;
      layoutOptions: Record<string, string>;
      children: ElkNode[];
      edges: ElkEdge[];
    }

    // Create the ELK graph with hierarchical structure
    const elkGraph: ElkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': elkDirection,
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'elk.spacing.nodeNode': String(config.nodesep),
        'elk.layered.spacing.nodeNodeBetweenLayers': String(config.ranksep),
        'elk.layered.spacing.edgeNodeBetweenLayers': String(config.edgesep),
        'elk.spacing.edgeNode': String(config.edgesep),
        'elk.edgeRouting': 'ORTHOGONAL',
        'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
        'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
        'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
        'elk.layered.cycleBreaking.strategy': 'GREEDY',
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        'elk.layered.compaction.postCompaction.strategy': 'EDGE_LENGTH',
        'elk.padding': '[top=50,left=50,bottom=50,right=50]',
        // Padding for nested nodes (children within parents)
        'elk.spacing.componentComponent': '30',
        'elk.spacing.portPort': '10',
      },
      children: rootNodes,
      edges: elkEdges,
    };

    const layoutedGraph = await elk.layout(elkGraph);

    // Extract positions from the hierarchical layout recursively
    // For VueFlow, nested nodes need RELATIVE positions to their parent, not absolute
    const positionMap = new Map<string, { x: number; y: number }>();

    function extractPositions(nodes: ElkNode[], isRoot = true): void {
      nodes.forEach((node) => {
        // For root nodes, use absolute positions
        // For nested nodes, use relative positions (as calculated by ELK within the parent)
        const x = node.x ?? 0;
        const y = node.y ?? 0;
        positionMap.set(node.id, { x, y });

        // Recursively process children with their relative positions
        if (node.children && node.children.length > 0) {
          extractPositions(node.children, false);
        }
      });
    }

    if (layoutedGraph.children) {
      extractPositions(layoutedGraph.children, true);
    }

    // Apply positions to nodes
    const newNodes = nodes.map((node) => {
      const position = positionMap.get(node.id);
      if (position) {
        return {
          ...node,
          position: { x: position.x, y: position.y },
        };
      }
      return node;
    });

    // Return all edges (including containment edges), not just the ones used for layout
    self.postMessage({
      type: 'layout-complete',
      payload: { nodes: newNodes, edges },
    });
  } catch (error) {
    console.error('ELK layout error:', error);
    // Fallback: return nodes unchanged
    self.postMessage({
      type: 'layout-complete',
      payload: { nodes, edges },
    });
  }
};

// Export empty object to satisfy TypeScript
export {};
