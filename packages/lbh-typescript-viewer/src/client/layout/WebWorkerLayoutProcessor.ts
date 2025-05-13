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
  type: 'layout-complete';
  payload: LayoutResult;
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
        if (event.data.type === 'layout-complete') {
          // Clean up the event listener
          this.worker?.removeEventListener('message', onMessage);
          resolve(event.data.payload);
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
