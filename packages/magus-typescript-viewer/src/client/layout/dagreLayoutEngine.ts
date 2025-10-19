/**
 * Shared Dagre Layout Engine
 * Core layout logic used by both WebWorker and synchronous fallback
 */

import type * as dagre from '@dagrejs/dagre';
import type { Edge } from '@vue-flow/core';

import type { DependencyNode } from '../components/DependencyGraph/types';
import type { GraphTheme } from '../theme/graphTheme';

export interface DagreLayoutConfig {
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  nodesep: number;
  edgesep: number;
  ranksep: number;
  theme: GraphTheme;
  animationDuration?: number;
}

export interface LayoutResult {
  nodes: DependencyNode[];
  edges: Edge[];
}

const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 120;
const PARENT_PADDING = 40;

/**
 * Apply dagre layout algorithm to graph nodes and edges
 * @param nodes - The nodes to layout
 * @param edges - The edges connecting nodes
 * @param config - Layout configuration
 * @param dagreLib - The dagre library instance
 * @returns Layout result with positioned nodes
 */
export function applyDagreLayout(
  nodes: DependencyNode[],
  edges: Edge[],
  config: DagreLayoutConfig,
  dagreLib: typeof dagre
): LayoutResult {
  // Create a new directed graph using graphlib
  const g = new dagreLib.graphlib.Graph({ directed: true });

  // Set graph options
  const graphOptions: {
    rankdir?: string;
    nodesep?: number;
    edgesep?: number;
    ranksep?: number;
    marginx?: number;
    marginy?: number;
  } = {
    rankdir: config.direction,
    nodesep: config.nodesep,
    edgesep: config.edgesep,
    ranksep: config.ranksep,
    marginx: 50,
    marginy: 50,
  };

  g.setGraph(graphOptions);
  g.setDefaultNodeLabel(() => ({}));
  g.setDefaultEdgeLabel(() => ({}));

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
    const nodeWidth = measured?.width ?? (typeof node.width === 'number' ? node.width : DEFAULT_WIDTH);
    const nodeHeight = measured?.height ?? (typeof node.height === 'number' ? node.height : DEFAULT_HEIGHT);

    g.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
      label: node.data?.label ?? node.id,
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
  dagreLib.layout(g);

  // First pass: position all leaf nodes from dagre
  const nodeMap = new Map<string, DependencyNode>();
  nodes.forEach((node) => {
    if (!parentNodeIds.has(node.id)) {
      const dagreNode = g.node(node.id) as { x: number; y: number; width?: number; height?: number } | undefined;
      if (dagreNode) {
        nodeMap.set(node.id, {
          ...node,
          position: {
            x: dagreNode.x - (dagreNode.width ?? DEFAULT_WIDTH) / 2,
            y: dagreNode.y - (dagreNode.height ?? DEFAULT_HEIGHT) / 2,
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
          : DEFAULT_WIDTH;
      const height =
        typeof processed.style === 'object' && typeof processed.style.height === 'number'
          ? processed.style.height
          : DEFAULT_HEIGHT;
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

      return {
        x: minX - PARENT_PADDING,
        y: minY - PARENT_PADDING,
        width: maxX - minX + PARENT_PADDING * 2,
        height: maxY - minY + PARENT_PADDING * 2,
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
  return { nodes: newNodes, edges };
}

/**
 * Simple grid layout fallback when dagre fails
 * @param nodes - The nodes to layout
 * @param edges - The edges connecting nodes
 * @returns Layout result with positioned nodes in a grid
 */
export function applyGridLayoutFallback(nodes: DependencyNode[], edges: Edge[]): LayoutResult {
  const packages = nodes.filter((n) => n.type === 'package');
  const modules = nodes.filter((n) => n.type === 'module');
  const others = nodes.filter((n) => n.type !== 'package' && n.type !== 'module');

  let currentY = 50;
  let currentX = 50;
  const horizontalSpacing = 250;
  const verticalSpacing = 200;
  const maxPerRow = 4;

  // Layout packages
  packages.forEach((node, index) => {
    if (index > 0 && index % maxPerRow === 0) {
      currentY += verticalSpacing;
      currentX = 50;
    }
    node.position = { x: currentX, y: currentY };
    currentX += horizontalSpacing;
  });

  // Layout modules
  if (modules.length > 0) {
    currentY += verticalSpacing;
    currentX = 50;
    modules.forEach((node, index) => {
      if (index > 0 && index % maxPerRow === 0) {
        currentY += verticalSpacing;
        currentX = 50;
      }
      node.position = { x: currentX, y: currentY };
      currentX += horizontalSpacing;
    });
  }

  // Layout other nodes
  if (others.length > 0) {
    currentY += verticalSpacing;
    currentX = 50;
    others.forEach((node, index) => {
      if (index > 0 && index % maxPerRow === 0) {
        currentY += verticalSpacing;
        currentX = 50;
      }
      node.position = { x: currentX, y: currentY };
      currentX += horizontalSpacing;
    });
  }

  return { nodes, edges };
}
