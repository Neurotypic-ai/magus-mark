/**
 * Web Worker for handling complex graph layout calculations
 * This offloads CPU-intensive operations from the main thread
 */

import * as dagre from '@dagrejs/dagre';

import { createLogger } from '../../shared/utils/logger';
import { applyDagreLayout } from '../layout/dagreLayoutEngine';

import type { Edge } from '@vue-flow/core';

import type { DependencyNode } from '../components/DependencyGraph/types';
import type { DagreLayoutConfig } from '../layout/dagreLayoutEngine';

const logger = createLogger('GraphLayoutWorker');

// Worker message types
interface WorkerMessage {
  type: 'process-layout';
  payload: {
    nodes: DependencyNode[];
    edges: Edge[];
    config: DagreLayoutConfig;
  };
}

// Handle messages from the main thread using dagre layout
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { nodes, edges, config } = event.data.payload;

  try {
    const startTime = performance.now();

    // Use the shared dagre layout engine
    const result = applyDagreLayout(nodes, edges, config, dagre);

    const duration = performance.now() - startTime;
    logger.info(`Layout completed in ${duration.toFixed(2)}ms for ${String(nodes.length)} nodes`);

    self.postMessage({
      type: 'layout-complete',
      payload: result,
    });
  } catch (error) {
    logger.error('Layout error', error);
    // Fallback: return nodes unchanged
    self.postMessage({
      type: 'layout-complete',
      payload: { nodes, edges },
    });
  }
};

// Export empty object to satisfy TypeScript
export {};
