/**
 * Web Worker for handling complex graph layout calculations
 * This offloads CPU-intensive operations from the main thread
 */

import { createLogger } from '../../shared/utils/logger';
import { applyElkLayout } from '../layout/elkLayoutEngine';

import type { DependencyNode, GraphEdge } from '../components/DependencyGraph/types';
import type { ElkLayoutConfig } from '../layout/elkLayoutEngine';

const logger = createLogger('GraphLayoutWorker');

// Worker message types
interface WorkerMessage {
  type: 'process-layout';
  payload: {
    nodes: DependencyNode[];
    edges: GraphEdge[];
    config: ElkLayoutConfig;
  };
}

// Handle messages from the main thread using ELK layout
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { nodes, edges, config } = event.data.payload;

  try {
    const startTime = performance.now();

    // Use the shared ELK layout engine (async)
    const result = await applyElkLayout(nodes, edges, config);

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
