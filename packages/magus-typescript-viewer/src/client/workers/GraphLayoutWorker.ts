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
      // Priority order: measured dimensions > node dimensions > default dimensions
      const measured = (node as unknown as { measured?: { width?: number; height?: number } }).measured;
      const nodeWidth = measured?.width ?? (typeof node.width === 'number' ? node.width : defaultWidth);
      const nodeHeight = measured?.height ?? (typeof node.height === 'number' ? node.height : defaultHeight);

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

    // First pass: position all leaf nodes from dagre
    const nodeMap = new Map<string, DependencyNode>();
    nodes.forEach((node) => {
      if (!parentNodeIds.has(node.id)) {
        const dagreNode = g.node(node.id);
        if (dagreNode) {
          nodeMap.set(node.id, {
            ...node,
            position: {
              x: dagreNode.x - (dagreNode.width || defaultWidth) / 2,
              y: dagreNode.y - (dagreNode.height || defaultHeight) / 2,
            },
          });
        } else {
          nodeMap.set(node.id, node);
        }
      }
    });

    // Helper to get node bounds (recursively for parent nodes)
    const getNodeBounds = (nodeId: string): { x: number; y: number; width: number; height: number } | null => {
      // Check if we already processed this node
      const processed = nodeMap.get(nodeId);
      if (processed?.position) {
        const width =
          typeof processed.style === 'object' && typeof processed.style.width === 'number'
            ? processed.style.width
            : defaultWidth;
        const height =
          typeof processed.style === 'object' && typeof processed.style.height === 'number'
            ? processed.style.height
            : defaultHeight;
        return {
          x: processed.position.x,
          y: processed.position.y,
          width,
          height,
        };
      }

      // If not processed yet and it's a parent, calculate from children
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return null;

      if (parentNodeIds.has(nodeId)) {
        const children = nodes.filter((n) => n.parentNode === nodeId);
        if (children.length === 0) return null;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        children.forEach((child) => {
          const childBounds = getNodeBounds(child.id);
          if (childBounds) {
            minX = Math.min(minX, childBounds.x);
            minY = Math.min(minY, childBounds.y);
            maxX = Math.max(maxX, childBounds.x + childBounds.width);
            maxY = Math.max(maxY, childBounds.y + childBounds.height);
          }
        });

        if (minX === Infinity) return null;

        const padding = 40;
        return {
          x: minX - padding,
          y: minY - padding,
          width: maxX - minX + padding * 2,
          height: maxY - minY + padding * 2,
        };
      }

      return null;
    };

    // Second pass: position all parent nodes based on their children
    nodes.forEach((node) => {
      if (parentNodeIds.has(node.id)) {
        const bounds = getNodeBounds(node.id);
        if (bounds) {
          nodeMap.set(node.id, {
            ...node,
            position: { x: bounds.x, y: bounds.y },
            style: {
              ...(typeof node.style === 'object' ? node.style : {}),
              width: bounds.width,
              height: bounds.height,
            },
          });
        } else {
          // Fallback: keep original node
          nodeMap.set(node.id, node);
        }
      }
    });

    // Convert map back to array
    const newNodes = Array.from(nodeMap.values());

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
