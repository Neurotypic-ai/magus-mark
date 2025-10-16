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
  rankdir: 'TB' | 'BT' | 'LR' | 'RL';
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
    const ELK = await import('elkjs/lib/elk.bundled.js');
    const elk = new ELK.default();

    const defaultWidth = 200;
    const defaultHeight = 120;

    const elkNodes = nodes.map((node) => ({
      id: node.id,
      width: (node as unknown as { measured?: { width?: number } }).measured?.width ?? defaultWidth,
      height: (node as unknown as { measured?: { height?: number } }).measured?.height ?? defaultHeight,
      layoutOptions: {
        ...(node.data?.parentId && { 'elk.hierarchyHandling': 'INCLUDE_CHILDREN' }),
      },
    }));

    const validEdges = edges.filter(
      (edge) => nodes.some((n) => n.id === edge.source) && nodes.some((n) => n.id === edge.target)
    );

    const elkEdges = validEdges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    }));

    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': config.rankdir,
        'elk.spacing.nodeNode': String(config.nodesep),
        'elk.layered.spacing.nodeNodeBetweenLayers': String(config.ranksep),
        'org.eclipse.elk.edgeRouting': 'ORTHOGONAL',
        'org.eclipse.elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
        'org.eclipse.elk.layered.cycleBreaking.strategy': 'GREEDY',
        ...(elkNodes.some((n) => (n.layoutOptions as Record<string, string>)['elk.hierarchyHandling']) && {
          'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        }),
      },
      children: elkNodes,
      edges: elkEdges,
    } as const;

    const layoutedGraph = await elk.layout(elkGraph);

    const newNodes = nodes.map((node) => {
      const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
      if (elkNode) {
        return {
          ...node,
          position: { x: elkNode.x ?? 0, y: elkNode.y ?? 0 },
        };
      }
      return node;
    });

    self.postMessage({
      type: 'layout-complete',
      payload: { nodes: newNodes, edges: validEdges },
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
