/**
 * Web Worker for handling complex graph layout calculations
 * This offloads CPU-intensive operations from the main thread
 */

import type { Edge } from '@xyflow/react';

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
  rankdir: 'TB' | 'BT' | 'LR' | 'RL';
  nodesep: number;
  edgesep: number;
  ranksep: number;
  theme: GraphTheme;
  animationDuration?: number;
}

// Simple ELK-like layout algorithm
class LayoutEngine {
  private config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  public process(nodes: DependencyNode[], edges: Edge[]): { nodes: DependencyNode[]; edges: Edge[] } {
    // Clone the nodes and edges to avoid mutation
    const processedNodes = this.cloneNodes(nodes);
    const processedEdges = this.cloneEdges(edges);

    if (processedNodes.length === 0) {
      return { nodes: processedNodes, edges: processedEdges };
    }

    // Group nodes by type for hierarchical layout
    const nodesByType = this.groupNodesByType(processedNodes);

    // Calculate positions based on node types and relationships
    this.positionNodes(processedNodes, processedEdges, nodesByType);

    return {
      nodes: processedNodes,
      edges: processedEdges,
    };
  }

  private cloneNodes(nodes: DependencyNode[]): DependencyNode[] {
    return nodes.map((node) => ({ ...node }));
  }

  private cloneEdges(edges: Edge[]): Edge[] {
    return edges.map((edge) => ({ ...edge }));
  }

  private groupNodesByType(nodes: DependencyNode[]): Record<string, DependencyNode[]> {
    const groups: Record<string, DependencyNode[]> = {};

    nodes.forEach((node) => {
      const type = node.type || 'default';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(node);
    });

    return groups;
  }

  private positionNodes(nodes: DependencyNode[], edges: Edge[], nodesByType: Record<string, DependencyNode[]>): void {
    // Determine the layout direction
    const isHorizontal = this.config.rankdir === 'LR' || this.config.rankdir === 'RL';

    // Prioritize node types for layout (packages -> modules -> classes/interfaces)
    const nodeTypeOrder = ['package', 'module', 'class', 'interface'];

    // Initial spacing values
    const xSpacing = isHorizontal ? this.config.ranksep : this.config.nodesep;
    const ySpacing = isHorizontal ? this.config.nodesep : this.config.ranksep;

    // Position each type of node in layers
    let xOffset = 0;

    nodeTypeOrder.forEach((type) => {
      if (!nodesByType[type]) return;

      const typeNodes = nodesByType[type];
      const nodesPerRow = Math.ceil(Math.sqrt(typeNodes.length));

      // Position nodes in a grid
      typeNodes.forEach((node, index) => {
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;

        if (isHorizontal) {
          node.position = {
            x: xOffset + col * xSpacing,
            y: row * ySpacing,
          };
        } else {
          node.position = {
            x: col * xSpacing,
            y: xOffset + row * ySpacing,
          };
        }
      });

      // Update offset for the next layer
      const layerSize = isHorizontal ? nodesPerRow * xSpacing : Math.ceil(typeNodes.length / nodesPerRow) * ySpacing;

      xOffset += layerSize + this.config.ranksep * 2;
    });

    // Adjust positions based on parent-child relationships
    this.adjustPositionsForRelationships(nodes, edges, isHorizontal);
  }

  private adjustPositionsForRelationships(nodes: DependencyNode[], edges: Edge[], isHorizontal: boolean): void {
    // Create a map of node IDs to nodes for quick lookup
    const nodeMap = new Map<string, DependencyNode>();
    nodes.forEach((node) => nodeMap.set(node.id.toString(), node));

    // Adjust child nodes to be closer to parents
    edges.forEach((edge) => {
      const source = nodeMap.get(edge.source.toString());
      const target = nodeMap.get(edge.target.toString());

      if (source && target) {
        // If the edge represents a parent-child relationship
        if ((edge.type === 'inheritance' || edge.type === 'implements') && source.type !== target.type) {
          // Move child slightly closer to parent
          const parentPos = isHorizontal ? source.position.x : source.position.y;
          const childPos = isHorizontal ? target.position.x : target.position.y;

          // Calculate the adjustment (move 20% closer)
          const adjustment = (childPos - parentPos) * 0.2;

          if (isHorizontal) {
            target.position.x -= adjustment;
          } else {
            target.position.y -= adjustment;
          }
        }
      }
    });
  }
}

// Handle messages from the main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  if (type === 'process-layout') {
    const { nodes, edges, config } = payload;

    // Process the layout
    const layoutEngine = new LayoutEngine(config);
    const result = layoutEngine.process(nodes, edges);

    // Send the result back to the main thread
    self.postMessage({
      type: 'layout-complete',
      payload: result,
    });
  }
};

// Export empty object to satisfy TypeScript
export {};
