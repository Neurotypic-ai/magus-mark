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

    // Build a hierarchical structure for ELK
    // Separate nodes into packages, modules, and other nodes
    const packageNodes = nodes.filter((n) => !n.data?.parentId);
    const childNodes = nodes.filter((n) => n.data?.parentId);

    // Create a map for quick parent lookup
    const childrenByParent = new Map<string, DependencyNode[]>();
    childNodes.forEach((child) => {
      const parentId = child.data?.parentId;
      if (parentId) {
        if (!childrenByParent.has(parentId)) {
          childrenByParent.set(parentId, []);
        }
        childrenByParent.get(parentId)?.push(child);
      }
    });

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

    // Recursively build ELK node structure
    const buildElkNode = (node: DependencyNode): ElkNode => {
      const children = childrenByParent.get(node.id) ?? [];
      const nodeWidth = (node as unknown as { measured?: { width?: number } }).measured?.width ?? defaultWidth;
      const nodeHeight = (node as unknown as { measured?: { height?: number } }).measured?.height ?? defaultHeight;

      const elkNode: ElkNode = {
        id: node.id,
        width: nodeWidth,
        height: nodeHeight,
      };

      // Include children if this node has any
      if (children.length > 0) {
        elkNode.children = children.map((child) => buildElkNode(child));
        elkNode.layoutOptions = {
          'elk.padding': '[top=40,left=20,bottom=20,right=20]',
        };
      }

      return elkNode;
    };

    // Build root-level nodes (packages)
    const elkNodes = packageNodes.map((node) => buildElkNode(node));

    // Filter edges to only include valid connections and exclude containment edges
    // Containment edges (parent-child in hierarchy) should not constrain the layout
    const validEdges = edges.filter((edge) => {
      const hasValidNodes = nodes.some((n) => n.id === edge.source) && nodes.some((n) => n.id === edge.target);
      const edgeData = edge.data as { type?: string } | undefined;
      const isNotContainment = edgeData?.type !== 'contains';
      return hasValidNodes && isNotContainment;
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

    // Create the ELK graph
    const elkGraph: ElkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': config.direction,
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
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'elk.padding': '[top=40,left=40,bottom=40,right=40]',
      },
      children: elkNodes,
      edges: elkEdges,
    };

    const layoutedGraph = await elk.layout(elkGraph);

    // Flatten the hierarchical result back to a flat array with absolute positions
    const flattenNodes = (elkNode: ElkNode, parentX = 0, parentY = 0): { id: string; x: number; y: number }[] => {
      const nodeX = (elkNode.x ?? 0) + parentX;
      const nodeY = (elkNode.y ?? 0) + parentY;
      const result = [{ id: elkNode.id, x: nodeX, y: nodeY }];

      if (elkNode.children && elkNode.children.length > 0) {
        elkNode.children.forEach((child) => {
          result.push(...flattenNodes(child, nodeX, nodeY));
        });
      }

      return result;
    };

    // Flatten all nodes from the hierarchy
    const positionMap = new Map<string, { x: number; y: number }>();
    if (layoutedGraph.children) {
      layoutedGraph.children.forEach((child) => {
        flattenNodes(child as ElkNode).forEach((item) => {
          positionMap.set(item.id, { x: item.x, y: item.y });
        });
      });
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
