/**
 * WebWorkerLayoutProcessor - A wrapper for the graph layout web worker
 * Handles communication with the web worker for offloading CPU-intensive layout calculations
 */

import { defaultLayoutConfig } from '../components/DependencyGraph/layout/config';

import type { Edge } from '@xyflow/react';

import type { DependencyNode } from '../components/DependencyGraph/types';
import type { GraphTheme } from '../theme/graphTheme';

// Layout configuration type
export interface LayoutConfig {
  rankdir: 'TB' | 'BT' | 'LR' | 'RL';
  nodesep: number;
  edgesep: number;
  ranksep: number;
  theme: GraphTheme;
  animationDuration?: number;
}

// Layout processing result type
export interface LayoutResult {
  nodes: DependencyNode[];
  edges: Edge[];
}

/**
 * Worker message types
 */
interface WorkerRequest {
  type: 'process-layout';
  payload: {
    nodes: DependencyNode[];
    edges: Edge[];
    config: LayoutConfig;
  };
}

interface WorkerResponse {
  type: 'layout-complete' | 'layout-error';
  payload: LayoutResult | { error: string };
}

/**
 * A class that manages the web worker for processing graph layouts
 */
export class WebWorkerLayoutProcessor {
  private worker: Worker | null = null;
  private config: LayoutConfig;
  private workerSupported: boolean;

  constructor(config?: Partial<LayoutConfig>) {
    this.config = {
      ...defaultLayoutConfig,
      ...config,
    } as LayoutConfig;

    // Check if web workers are supported
    this.workerSupported = typeof Worker !== 'undefined';

    // Initialize worker if supported
    if (this.workerSupported) {
      this.initWorker();
    }
  }

  /**
   * Initialize the web worker
   */
  private initWorker(): void {
    try {
      this.worker = new Worker(new URL('../workers/GraphLayoutWorker.ts', import.meta.url), { type: 'module' });
    } catch (error) {
      console.error('Failed to initialize layout worker:', error);
      this.workerSupported = false;
    }
  }

  /**
   * Process the graph layout using the web worker
   * @param graphData The graph data to process
   * @returns A promise that resolves with the processed layout
   */
  public processLayout(graphData: { nodes: DependencyNode[]; edges: Edge[] }): Promise<LayoutResult> {
    // Create a deep copy of nodes and edges to avoid mutation
    const nodes = JSON.parse(JSON.stringify(graphData.nodes)) as DependencyNode[];
    const edges = JSON.parse(JSON.stringify(graphData.edges)) as Edge[];

    // If worker is not supported or failed to initialize, use fallback
    if (!this.workerSupported || !this.worker) {
      return this.fallbackProcessLayout(nodes, edges);
    }

    // Use the web worker
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      // Set up the message handler for worker responses
      const onMessage = (event: MessageEvent<WorkerResponse>) => {
        this.worker?.removeEventListener('message', onMessage); // Clean up listener
        this.worker?.removeEventListener('error', onError); // Clean up listener
        if (event.data.type === 'layout-complete') {
          resolve(event.data.payload as LayoutResult);
        } else {
          const errorPayload = event.data.payload as { error: string };
          reject(new Error(`Layout worker error: ${errorPayload.error}`));
        }
      };

      // Set up error handler
      const onError = (error: ErrorEvent) => {
        this.worker?.removeEventListener('error', onError);
        console.error('Layout worker error:', error);
        // Fall back to synchronous processing
        this.fallbackProcessLayout(nodes, edges).then(resolve).catch(reject);
      };

      // Add event listeners
      this.worker.addEventListener('message', onMessage);
      this.worker.addEventListener('error', onError);

      // Send the data to the worker
      const message: WorkerRequest = {
        type: 'process-layout',
        payload: {
          nodes,
          edges,
          config: this.config,
        },
      };

      this.worker.postMessage(message);
    });
  }

  /**
   * Fallback synchronous layout processing when web worker is not available
   * @param nodes The nodes to process
   * @param edges The edges to process
   * @returns A promise that resolves with the processed layout
   */
  private fallbackProcessLayout(nodes: DependencyNode[], edges: Edge[]): Promise<LayoutResult> {
    // Simple fallback layout algorithm - just spread nodes in a grid
    const columns = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 200;

    nodes.forEach((node, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;

      node.position = {
        x: col * spacing,
        y: row * spacing,
      };
    });

    return Promise.resolve({ nodes, edges });
  }

  /**
   * Terminate the web worker
   */
  public dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Simple ELK-like layout algorithm
// Removed old LayoutEngine class, will use ELK directly

// Handle messages from the main thread
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  // Given event is MessageEvent<WorkerRequest>, event.data.type is always 'process-layout'.
  // The 'if (event.data.type === 'process-layout')' check is redundant.
  const { nodes, edges, config } = event.data.payload;

  try {
    // Dynamically import ELK inside the worker
    const ELK = await import('elkjs/lib/elk.bundled.js');
    const elk = new ELK.default();

    const elkNodes = nodes.map((node) => ({
      id: node.id,
      width: node.measured?.width ?? config.theme.nodes.minDimensions.width,
      height: node.measured?.height ?? config.theme.nodes.minDimensions.height,
      // ELK specific layout options can be added here if needed
      // parent: node.data.parentId, // ELK supports parent property for hierarchy
      layoutOptions: {
        ...(node.data.parentId && { 'elk.hierarchyHandling': 'INCLUDE_CHILDREN' }),
      },
    }));

    // Filter out edges with missing source or target, which can happen during graph updates
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
        // Ensure hierarchy is handled if parentId is used
        ...(elkNodes.some((n) => n.layoutOptions['elk.hierarchyHandling']) && {
          'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        }),
      },
      children: elkNodes,
      edges: elkEdges,
    };

    const layoutedGraph = await elk.layout(elkGraph);

    const newNodes = nodes.map((node) => {
      const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
      if (elkNode) {
        return {
          ...node,
          position: { x: elkNode.x ?? 0, y: elkNode.y ?? 0 },
          // Update measured dimensions if ELK changed them (though usually it respects input)
          measured: {
            width: elkNode.width,
            height: elkNode.height,
          },
        };
      }
      return node;
    });

    self.postMessage({
      type: 'layout-complete',
      payload: { nodes: newNodes, edges }, // Send original edges back
    } as WorkerResponse);
  } catch (error) {
    console.error('Error in layout worker:', error);
    self.postMessage({
      type: 'layout-error',
      payload: { error: error instanceof Error ? error.message : 'Unknown layout error' },
    } as WorkerResponse);
  }
};

// Export empty object to satisfy TypeScript module requirements
export {};
