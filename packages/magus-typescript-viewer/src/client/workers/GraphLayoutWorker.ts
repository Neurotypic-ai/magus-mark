/**
 * Web Worker for handling complex graph layout calculations
 * This offloads CPU-intensive operations from the main thread
 */

import * as dagre from '@dagrejs/dagre';
import * as graphlib from '@dagrejs/graphlib';

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

// Handle messages from the main thread using dagre layout
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { nodes, edges, config } = event.data.payload;

  try {
    // Create a new directed graph using graphlib
    const g = new graphlib.Graph({ directed: true });

    // Set graph options - map config to dagre options
    const graphOptions: dagre.GraphLabel = {
      rankdir: mapDirectionToDagre(config.direction),
      nodesep: config.nodesep,
      edgesep: config.edgesep,
      ranksep: config.ranksep,
      marginx: 50,
      marginy: 50,
    };

    g.setGraph(graphOptions);

    // Set default node options
    g.setDefaultNodeLabel(() => ({}));

    // Set default edge options
    g.setDefaultEdgeLabel(() => ({}));

    const defaultWidth = 200;
    const defaultHeight = 120;

    // Separate parent nodes from leaf nodes
    // Parent nodes (package, module, group) should NOT be laid out by dagre
    // Instead, they will be positioned based on their children's positions
    const parentNodeIds = new Set(
      nodes.filter((n) => n.type === 'package' || n.type === 'module' || n.type === 'group').map((n) => n.id)
    );

    // Only add leaf nodes to dagre for layout
    const leafNodes = nodes.filter((n) => !parentNodeIds.has(n.id));

    leafNodes.forEach((node) => {
      const nodeWidth = (node as unknown as { measured?: { width?: number } }).measured?.width ?? defaultWidth;
      const nodeHeight = (node as unknown as { measured?: { height?: number } }).measured?.height ?? defaultHeight;

      g.setNode(node.id, {
        width: nodeWidth,
        height: nodeHeight,
        label: node.data?.label || node.id,
      });
    });

    // Filter edges to only include valid connections and exclude containment edges
    // Containment edges are handled by VueFlow parentNode, not by layout algorithm
    const validEdges = edges.filter((edge) => {
      const edgeType = (edge.data as { type?: string } | undefined)?.type;
      const isValid = nodes.some((n) => n.id === edge.source) && nodes.some((n) => n.id === edge.target);
      const isNotContainment = edgeType !== 'contains';
      return isValid && isNotContainment;
    });

    // Add edges to the graph
    validEdges.forEach((edge) => {
      // Set edge options based on type
      const edgeOptions: { minlen?: number } = {};
      const edgeType = (edge.data as { type?: string } | undefined)?.type;

      // Different edge types can have different weights/minlen for better layout
      switch (edgeType) {
        case 'inheritance':
          edgeOptions.minlen = 2; // Longer distance for inheritance relationships
          break;
        case 'implements':
          edgeOptions.minlen = 1;
          break;
        case 'dependency':
        case 'import':
        case 'export':
        default:
          edgeOptions.minlen = 1;
          break;
      }

      g.setEdge(edge.source, edge.target, edgeOptions);
    });

    // Run dagre layout
    dagre.layout(g as any);

    // Extract positions from dagre layout
    const newNodes = nodes.map((node) => {
      // If this is a leaf node, use dagre's calculated position
      if (!parentNodeIds.has(node.id)) {
        const dagreNode = g.node(node.id);
        if (dagreNode) {
          return {
            ...node,
            position: {
              x: dagreNode.x - (dagreNode.width || defaultWidth) / 2,
              y: dagreNode.y - (dagreNode.height || defaultHeight) / 2,
            },
          };
        }
        return node;
      }

      // This is a parent node - calculate position and size based on children
      const children = nodes.filter((n) => n.parentNode === node.id);
      if (children.length > 0) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        children.forEach((child) => {
          const childDagre = g.node(child.id);
          if (childDagre) {
            const childX = childDagre.x - childDagre.width / 2;
            const childY = childDagre.y - childDagre.height / 2;
            minX = Math.min(minX, childX);
            minY = Math.min(minY, childY);
            maxX = Math.max(maxX, childX + childDagre.width);
            maxY = Math.max(maxY, childY + childDagre.height);
          }
        });

        // Add padding around children
        const padding = 40;
        return {
          ...node,
          position: { x: minX - padding, y: minY - padding },
          style: {
            ...(typeof node.style === 'object' ? node.style : {}),
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2,
          },
        };
      }

      // No children, return as-is
      return node;
    });

    // Return all edges (including containment edges), not just the ones used for layout
    self.postMessage({
      type: 'layout-complete',
      payload: { nodes: newNodes, edges },
    });
  } catch (error) {
    console.error('Dagre layout error:', error);
    // Fallback: return nodes unchanged
    self.postMessage({
      type: 'layout-complete',
      payload: { nodes, edges },
    });
  }
};

// Helper function to map config directions to dagre rankdir
function mapDirectionToDagre(direction: string): 'TB' | 'BT' | 'LR' | 'RL' {
  switch (direction) {
    case 'DOWN':
      return 'TB';
    case 'UP':
      return 'BT';
    case 'LEFT':
      return 'RL';
    case 'RIGHT':
    default:
      return 'LR';
  }
}

// Export empty object to satisfy TypeScript
export {};
