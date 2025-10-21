import * as dagre from '@dagrejs/dagre';

import { createLogger } from '../../../../shared/utils/logger';
import { defaultLayoutConfig, mergeConfig } from './config';
import { LayoutError } from './errors';

import type { DependencyGraph } from '../types';
import type { LayoutConfig } from './config';

const logger = createLogger('LayoutProcessor');

export class LayoutProcessor {
  private config: LayoutConfig;
  private cache = new Map<string, DependencyGraph>();

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = mergeConfig(config, defaultLayoutConfig);
  }

  // calculateContainerDimensions removed - now handled by worker

  processLayout(graph: DependencyGraph): Promise<DependencyGraph> {
    try {
      // Generate cache key based on graph structure
      const cacheKey = this.generateCacheKey(graph);

      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        logger.debug('Using cached layout');
        return Promise.resolve(cachedResult);
      }

      // Create a new dagre graph
      const g = new dagre.graphlib.Graph({ compound: true });

      // Set graph options
      g.setGraph({
        rankdir: this.config.direction,
        nodesep: this.config.nodeSpacing,
        ranksep: this.config.rankSpacing,
        edgesep: this.config.edgeSpacing,
        marginx: this.config.margins?.left,
        marginy: this.config.margins?.top,
        acyclicer: 'greedy',
        ranker: 'network-simplex',
      });

      // Default to allow edges between same rank
      g.setDefaultEdgeLabel(() => ({}));

      // Add nodes to dagre with dimensions if available
      graph.nodes.forEach((node) => {
        // Try to get measured or explicit dimensions
        const nodeWithDims = node as unknown as {
          measured?: { width?: number; height?: number };
          width?: number;
          height?: number;
        };
        // Use minimal fallbacks to prevent NaN - nodes will size from content after VueFlow measures them
        const width = nodeWithDims.measured?.width ?? nodeWithDims.width ?? 50;
        const height = nodeWithDims.measured?.height ?? nodeWithDims.height ?? 30;

        g.setNode(node.id, { width, height });
      });

      // Add edges to dagre
      graph.edges.forEach((edge) => {
        if (edge.source && edge.target) {
          g.setEdge(edge.source, edge.target);
        }
      });

      // Perform layout
      dagre.layout(g);

      // Extract positions - dagre returns center position, convert to top-left
      const layoutedNodes = graph.nodes.map((node) => {
        const layoutNode = g.node(node.id);

        return {
          ...node,
          position: {
            x: layoutNode.x - layoutNode.width / 2,
            y: layoutNode.y - layoutNode.height / 2,
          },
        };
      });

      const result = {
        nodes: layoutedNodes,
        edges: graph.edges,
      };

      // Cache the result
      this.cache.set(cacheKey, result);

      return Promise.resolve(result);
    } catch (error) {
      logger.error('Layout processing failed:', error);
      throw new LayoutError('Failed to process layout', { cause: error });
    }
  }

  private generateCacheKey(graph: DependencyGraph): string {
    // Create a minimal representation for caching
    const minimalGraph = {
      nodes: graph.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        data: {
          parentId: node.data?.parentId,
        },
      })),
      edges: graph.edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        type: edge.type,
      })),
    };

    return JSON.stringify(minimalGraph);
  }

  clearCache(): void {
    this.cache.clear();
  }
}
