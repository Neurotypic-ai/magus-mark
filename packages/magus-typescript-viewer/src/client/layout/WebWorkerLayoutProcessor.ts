/**
 * WebWorkerLayoutProcessor - A wrapper for the graph layout web worker
 * Handles communication with the web worker for offloading CPU-intensive layout calculations
 */

import { defaultLayoutConfig } from '../components/DependencyGraph/layout/config';

import type { Edge } from '@vue-flow/core';

import type { DependencyNode } from '../components/DependencyGraph/types';
import type { GraphTheme } from '../theme/graphTheme';

// Internal layout configuration type used by the worker
// Dagre only supports hierarchical layout with configurable direction
export interface LayoutConfig {
  direction: 'TB' | 'BT' | 'LR' | 'RL'; // Dagre rankdir parameter
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
  private config: LayoutConfig;
  private workerSupported: boolean;

  constructor(config?: WebWorkerLayoutConfig) {
    // Map the default config to the worker's expected format
    const mergedConfig = {
      ...defaultLayoutConfig,
      ...config,
    };

    // Map TB/BT/LR/RL to dagre's expected direction values (no mapping needed)
    const mapDirection = (dir: string): 'TB' | 'BT' | 'LR' | 'RL' => {
      // Dagre uses the same direction names as our input
      switch (dir) {
        case 'TB':
        case 'BT':
        case 'LR':
        case 'RL':
          return dir;
        default:
          return 'LR';
      }
    };

    this.config = {
      direction: mapDirection(mergedConfig.direction ?? 'LR'),
      nodesep: mergedConfig.nodeSpacing ?? 150,
      ranksep: mergedConfig.rankSpacing ?? 250,
      edgesep: mergedConfig.edgeSpacing ?? 50,
      theme: mergedConfig.theme ?? defaultLayoutConfig.theme,
      animationDuration: mergedConfig.animationDuration,
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
  private async fallbackProcessLayout(nodes: DependencyNode[], edges: Edge[]): Promise<LayoutResult> {
    // Use dagre for fallback layout as well
    try {
      const { default: dagre } = await import('@dagrejs/dagre');
      const { default: graphlib } = await import('@dagrejs/graphlib');

      const g = new graphlib.Graph({ directed: true });

      // Set graph options using current config
      const graphOptions: {
        rankdir?: string;
        nodesep?: number;
        edgesep?: number;
        ranksep?: number;
        marginx?: number;
        marginy?: number;
      } = {
        rankdir: this.config.direction,
        nodesep: this.config.nodesep,
        edgesep: this.config.edgesep,
        ranksep: this.config.ranksep,
        marginx: 50,
        marginy: 50,
      };

      g.setGraph(graphOptions);
      g.setDefaultNodeLabel(() => ({}));
      g.setDefaultEdgeLabel(() => ({}));

      const defaultWidth = 200;
      const defaultHeight = 120;

      // Separate parent nodes from leaf nodes (same as worker)
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

      // Filter edges for layout (exclude containment edges)
      const validEdges = edges.filter((edge) => {
        const edgeType = (edge.data as { type?: string } | undefined)?.type;
        const isValid = nodes.some((n) => n.id === edge.source) && nodes.some((n) => n.id === edge.target);
        const isNotContainment = edgeType !== 'contains';
        return isValid && isNotContainment;
      });

      // Add edges
      validEdges.forEach((edge) => {
        g.setEdge(edge.source, edge.target, { minlen: 1 });
      });

      // Run dagre layout
      dagre.layout(g as any);

      // Extract positions (same logic as worker)
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

      return { nodes: newNodes, edges };
    } catch (error) {
      console.error('Dagre fallback layout error:', error);
      // Final fallback: simple grid layout
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
