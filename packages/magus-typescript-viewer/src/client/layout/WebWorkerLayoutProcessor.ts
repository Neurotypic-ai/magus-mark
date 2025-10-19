/**
 * WebWorkerLayoutProcessor - A wrapper for the graph layout web worker
 * Handles communication with the web worker for offloading CPU-intensive layout calculations
 */

import { createLogger } from '../../shared/utils/logger';
import { defaultLayoutConfig } from '../components/DependencyGraph/layout/config';
import { applyDagreLayout, applyGridLayoutFallback } from './dagreLayoutEngine';

import type { Edge } from '@vue-flow/core';

import type { DependencyNode } from '../components/DependencyGraph/types';
import type { GraphTheme } from '../theme/graphTheme';
import type { DagreLayoutConfig, LayoutResult } from './dagreLayoutEngine';

const logger = createLogger('WebWorkerLayoutProcessor');

// Re-export for backwards compatibility
export type { LayoutResult };
export type LayoutConfig = DagreLayoutConfig;

/**
 * Worker message types
 */
interface WorkerRequest {
  type: 'process-layout';
  payload: {
    nodes: DependencyNode[];
    edges: Edge[];
    config: DagreLayoutConfig;
  };
}

interface WorkerResponse {
  type: 'layout-complete' | 'layout-error';
  payload: LayoutResult | { error: string };
}

/**
 * Configuration for initializing the WebWorkerLayoutProcessor
 */
export interface WebWorkerLayoutConfig {
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
  nodeSpacing?: number;
  rankSpacing?: number;
  edgeSpacing?: number;
  theme?: GraphTheme;
  animationDuration?: number;
}

/**
 * A class that manages the web worker for processing graph layouts
 */
export class WebWorkerLayoutProcessor {
  private worker: Worker | null = null;
  private config: DagreLayoutConfig;
  private workerSupported: boolean;

  constructor(config?: WebWorkerLayoutConfig) {
    // Map the default config to the worker's expected format
    const mergedConfig = {
      ...defaultLayoutConfig,
      ...config,
    };

    // Validate direction is one of the allowed values
    const validateDirection = (dir: string | undefined): 'TB' | 'BT' | 'LR' | 'RL' => {
      if (dir === 'TB' || dir === 'BT' || dir === 'LR' || dir === 'RL') {
        return dir;
      }
      return 'LR'; // Default to left-right
    };

    const theme = mergedConfig.theme ?? defaultLayoutConfig.theme;
    if (!theme) {
      throw new Error('Theme is required for layout configuration');
    }

    this.config = {
      direction: validateDirection(mergedConfig.direction),
      nodesep: mergedConfig.nodeSpacing ?? 150,
      ranksep: mergedConfig.rankSpacing ?? 250,
      edgesep: mergedConfig.edgeSpacing ?? 50,
      theme: theme,
    };

    // Only set animationDuration if it's defined
    if (mergedConfig.animationDuration !== undefined) {
      this.config.animationDuration = mergedConfig.animationDuration;
    }

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
      logger.error('Failed to initialize layout worker', error);
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
        logger.error('Layout worker error', error);
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
  private async fallbackProcessLayout(nodes: DependencyNode[], edges: Edge[]): Promise<LayoutResult> {
    // Use dagre for fallback layout as well
    try {
      const dagre = await import('@dagrejs/dagre');
      return applyDagreLayout(nodes, edges, this.config, dagre);
    } catch (error) {
      logger.error('Dagre fallback layout error', error);
      // Final fallback: simple grid layout
      return applyGridLayoutFallback(nodes, edges);
    }
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
