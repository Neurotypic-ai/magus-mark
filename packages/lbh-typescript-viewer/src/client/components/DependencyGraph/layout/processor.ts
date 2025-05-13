import dagre from '@dagrejs/dagre';
import { getNodeDimensions } from '@xyflow/system';

import { createLogger } from '../../../../shared/utils/logger';
import { defaultLayoutConfig, mergeConfig } from './config';
import { LayoutError } from './errors';

import type { DependencyGraph, DependencyNode } from '../types';
import type { LayoutConfig } from './config';

const logger = createLogger('LayoutProcessor');

export class LayoutProcessor {
  private config: LayoutConfig;
  private cache = new Map<string, DependencyGraph>();

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = mergeConfig(config, defaultLayoutConfig);
  }

  private calculateGroupDimensions(
    groupNode: DependencyNode,
    childNodes: DependencyNode[]
  ): { width: number; height: number; x: number; y: number } {
    const children = childNodes.filter((child) => child.data.parentId === groupNode.id);

    if (!children.length) {
      return {
        width: this.config.theme?.nodes.minDimensions.width ?? 150 * 2,
        height: this.config.theme?.nodes.minDimensions.height ?? 50 * 2,
        x: 0,
        y: 0,
      };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    children.forEach((child) => {
      const nodeWidth = child.measured?.width ?? this.config.theme?.nodes.minDimensions.width ?? 150;
      const nodeHeight = child.measured?.height ?? this.config.theme?.nodes.minDimensions.height ?? 50;

      minX = Math.min(minX, child.position.x);
      minY = Math.min(minY, child.position.y);
      maxX = Math.max(maxX, child.position.x + nodeWidth);
      maxY = Math.max(maxY, child.position.y + nodeHeight);
    });

    const padding = (this.config.theme?.nodes.padding.content ?? 16) * 2;

    return {
      width: maxX - minX + padding,
      height: maxY - minY + padding,
      x: minX - padding / 2,
      y: minY - padding / 2,
    };
  }

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

      // Add nodes to dagre
      graph.nodes.forEach((node) => {
        const dimensions = getNodeDimensions(node);
        g.setNode(node.id, {
          ...dimensions,
          ...(node.data.parentId ? { parent: node.data.parentId } : {}),
        });
      });

      // Add edges to dagre
      graph.edges.forEach((edge) => {
        if (edge.source && edge.target) {
          g.setEdge(edge.source, edge.target);
        }
      });

      // Perform layout
      dagre.layout(g);

      // Extract positions with special handling for group nodes
      const layoutedNodes = graph.nodes.map((node) => {
        const layoutNode = g.node(node.id);

        if (node.type === 'group') {
          const dimensions = this.calculateGroupDimensions(node, graph.nodes);
          return {
            ...node,
            position: {
              x: dimensions.x,
              y: dimensions.y,
            },
            style: {
              ...node.style,
              width: dimensions.width,
              height: dimensions.height,
              zIndex: 1,
            },
          };
        }

        // For package nodes (no parentId), make them prominent
        if (!node.data.parentId) {
          return {
            ...node,
            position: {
              x: layoutNode.x - layoutNode.width / 2,
              y: layoutNode.y - layoutNode.height / 2,
            },
            style: {
              ...node.style,
              zIndex: 5,
            },
          };
        }

        // For other nodes, adjust position from center to top-left
        return {
          ...node,
          position: {
            x: layoutNode.x - layoutNode.width / 2,
            y: layoutNode.y - layoutNode.height / 2,
          },
          style: {
            ...node.style,
            zIndex: 1,
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
          parentId: node.data.parentId,
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
