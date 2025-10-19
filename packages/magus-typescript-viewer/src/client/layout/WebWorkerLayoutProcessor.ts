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

      // First pass: position all leaf nodes from dagre
      const nodeMap = new Map<string, DependencyNode>();
      nodes.forEach((node) => {
        if (!parentNodeIds.has(node.id)) {
          const dagreNode = g.node(node.id);
          if (dagreNode) {
            nodeMap.set(node.id, {
              ...node,
              position: {
                x: dagreNode.x - (dagreNode.width ?? defaultWidth) / 2,
                y: dagreNode.y - (dagreNode.height ?? defaultHeight) / 2,
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
