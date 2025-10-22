/**
 * Smart Clustering System
 * Advanced clustering algorithms for dependency graphs
 */

import { createLogger } from '../../../shared/utils/logger';

import type { DependencyNode, DependencyPackageGraph, GraphEdge } from '../../components/DependencyGraph/types';

const logger = createLogger('SmartClustering');

export interface ClusteringOptions {
  dependencyBased: boolean;
  complexityBased: boolean;
  couplingBased: boolean;
  temporalBased: boolean;
  customMetrics: string[];
}

export interface ClusteringResult {
  nodes: DependencyNode[];
  edges: GraphEdge[];
  clusters: Cluster[];
  metrics: ClusteringMetrics;
}

export interface Cluster {
  id: string;
  name: string;
  type: 'dependency' | 'complexity' | 'coupling' | 'temporal' | 'custom';
  nodes: DependencyNode[];
  metrics: {
    cohesion: number;
    coupling: number;
    complexity: number;
    size: number;
  };
  color: string;
  position?: { x: number; y: number };
}

export interface ClusteringMetrics {
  totalClusters: number;
  averageClusterSize: number;
  cohesionScore: number;
  couplingScore: number;
  complexityScore: number;
  modularity: number;
}

/**
 * Smart clustering engine that applies multiple clustering strategies
 */
export class SmartClusteringEngine {
  private options: ClusteringOptions;
  private nodeMap = new Map<string, DependencyNode>();
  private edgeMap = new Map<string, GraphEdge>();

  constructor(options: ClusteringOptions) {
    this.options = options;
  }

  /**
   * Apply smart clustering to the graph
   */
  public clusterGraph(nodes: DependencyNode[], edges: GraphEdge[], _data: DependencyPackageGraph): ClusteringResult {
    logger.info('Starting smart clustering');
    logger.debug(`Input: ${String(nodes.length)} nodes, ${String(edges.length)} edges`);

    // Build node and edge maps for efficient lookup
    this.buildMaps(nodes, edges);

    const clusters: Cluster[] = [];
    let clusteredNodes = [...nodes];

    // Apply clustering strategies in order of priority
    if (this.options.dependencyBased) {
      const dependencyClusters = this.clusterByDependencies(clusteredNodes, edges, _data);
      clusters.push(...dependencyClusters);
      clusteredNodes = this.removeClusteredNodes(clusteredNodes, dependencyClusters);
    }

    if (this.options.complexityBased) {
      const complexityClusters = this.clusterByComplexity(clusteredNodes, edges, _data);
      clusters.push(...complexityClusters);
      clusteredNodes = this.removeClusteredNodes(clusteredNodes, complexityClusters);
    }

    if (this.options.couplingBased) {
      const couplingClusters = this.clusterByCoupling(clusteredNodes, edges, _data);
      clusters.push(...couplingClusters);
      clusteredNodes = this.removeClusteredNodes(clusteredNodes, couplingClusters);
    }

    if (this.options.temporalBased) {
      const temporalClusters = this.clusterByTemporal(clusteredNodes, edges, _data);
      clusters.push(...temporalClusters);
      clusteredNodes = this.removeClusteredNodes(clusteredNodes, temporalClusters);
    }

    // Calculate clustering metrics
    const metrics = this.calculateMetrics(clusters, nodes, edges);

    logger.info(
      `Clustering complete: ${String(clusters.length)} clusters, ${String(clusteredNodes.length)} unclustered nodes`
    );

    return {
      nodes: clusteredNodes,
      edges,
      clusters,
      metrics,
    };
  }

  /**
   * Build node and edge maps for efficient lookup
   */
  private buildMaps(nodes: DependencyNode[], edges: GraphEdge[]): void {
    this.nodeMap.clear();
    this.edgeMap.clear();

    nodes.forEach((node) => {
      this.nodeMap.set(node.id, node);
    });

    edges.forEach((edge) => {
      this.edgeMap.set(`${edge.source}-${edge.target}`, edge);
    });
  }

  /**
   * Cluster nodes based on shared dependencies
   */
  private clusterByDependencies(nodes: DependencyNode[], edges: GraphEdge[], _data: DependencyPackageGraph): Cluster[] {
    logger.debug('Clustering by dependencies');

    const clusters: Cluster[] = [];
    const processed = new Set<string>();

    // Group modules by their shared dependencies
    const dependencyGroups = new Map<string, DependencyNode[]>();

    nodes.forEach((node) => {
      if (node.type !== 'module' || processed.has(node.id)) return;

      const moduleDeps = this.getModuleDependencies(node, _data);
      const depKey = this.createDependencyKey(moduleDeps);

      if (!dependencyGroups.has(depKey)) {
        dependencyGroups.set(depKey, []);
      }
      dependencyGroups.get(depKey)?.push(node);
    });

    // Create clusters for dependency groups
    dependencyGroups.forEach((groupNodes, depKey) => {
      if (groupNodes.length > 1) {
        const cluster = this.createCluster(`dep-${depKey}`, `Dependencies: ${depKey}`, 'dependency', groupNodes, edges);
        clusters.push(cluster);
        groupNodes.forEach((node) => processed.add(node.id));
      }
    });

    logger.debug(`Created ${String(clusters.length)} dependency-based clusters`);
    return clusters;
  }

  /**
   * Cluster nodes based on complexity metrics
   */
  private clusterByComplexity(nodes: DependencyNode[], edges: GraphEdge[], _data: DependencyPackageGraph): Cluster[] {
    logger.debug('Clustering by complexity');

    const clusters: Cluster[] = [];
    const processed = new Set<string>();

    // Calculate complexity for each module
    const complexityMap = new Map<string, number>();
    nodes.forEach((node) => {
      if (node.type === 'module') {
        complexityMap.set(node.id, this.calculateModuleComplexity(node, _data));
      }
    });

    // Group by complexity ranges
    const complexityRanges = [
      { min: 0, max: 5, name: 'Low Complexity' },
      { min: 6, max: 15, name: 'Medium Complexity' },
      { min: 16, max: 30, name: 'High Complexity' },
      { min: 31, max: Infinity, name: 'Very High Complexity' },
    ];

    complexityRanges.forEach((range) => {
      const groupNodes = nodes.filter((node) => {
        if (node.type !== 'module' || processed.has(node.id)) return false;
        const complexity = complexityMap.get(node.id) ?? 0;
        return complexity >= range.min && complexity <= range.max;
      });

      if (groupNodes.length > 1) {
        const cluster = this.createCluster(
          `complexity-${String(range.min)}-${String(range.max)}`,
          range.name,
          'complexity',
          groupNodes,
          edges
        );
        clusters.push(cluster);
        groupNodes.forEach((node) => processed.add(node.id));
      }
    });

    logger.debug(`Created ${String(clusters.length)} complexity-based clusters`);
    return clusters;
  }

  /**
   * Cluster nodes based on coupling metrics
   */
  private clusterByCoupling(nodes: DependencyNode[], edges: GraphEdge[], _data: DependencyPackageGraph): Cluster[] {
    logger.debug('Clustering by coupling');

    const clusters: Cluster[] = [];
    const processed = new Set<string>();

    // Calculate coupling for each module
    const couplingMap = new Map<string, number>();
    nodes.forEach((node) => {
      if (node.type === 'module') {
        couplingMap.set(node.id, this.calculateModuleCoupling(node, edges));
      }
    });

    // Find highly coupled modules
    const highlyCoupled = Array.from(couplingMap.entries())
      .filter(([_, coupling]) => coupling > 5)
      .sort((a, b) => b[1] - a[1]);

    // Group highly coupled modules
    const couplingGroups = new Map<string, DependencyNode[]>();
    highlyCoupled.forEach(([nodeId, _]) => {
      if (processed.has(nodeId)) return;

      const node = this.nodeMap.get(nodeId);
      if (!node) return;

      const connectedNodes = this.findConnectedNodes(node, edges, couplingMap);
      if (connectedNodes.length > 1) {
        const groupKey = connectedNodes
          .map((n) => n.id)
          .sort()
          .join('-');
        if (!couplingGroups.has(groupKey)) {
          couplingGroups.set(groupKey, connectedNodes);
          connectedNodes.forEach((n) => processed.add(n.id));
        }
      }
    });

    // Create clusters for coupling groups
    couplingGroups.forEach((groupNodes, groupKey) => {
      const cluster = this.createCluster(`coupling-${groupKey}`, `High Coupling Group`, 'coupling', groupNodes, edges);
      clusters.push(cluster);
    });

    logger.debug(`Created ${String(clusters.length)} coupling-based clusters`);
    return clusters;
  }

  /**
   * Cluster nodes based on temporal patterns
   */
  private clusterByTemporal(nodes: DependencyNode[], edges: GraphEdge[], _data: DependencyPackageGraph): Cluster[] {
    logger.debug('Clustering by temporal patterns');

    const clusters: Cluster[] = [];
    const processed = new Set<string>();

    // Group by creation time (if available)
    const temporalGroups = new Map<string, DependencyNode[]>();

    nodes.forEach((node) => {
      if (node.type !== 'module' || processed.has(node.id)) return;

      const createdAt = this.getNodeCreationTime(node, _data);
      const timeKey = this.createTemporalKey(createdAt);

      if (!temporalGroups.has(timeKey)) {
        temporalGroups.set(timeKey, []);
      }
      temporalGroups.get(timeKey)?.push(node);
    });

    // Create clusters for temporal groups
    temporalGroups.forEach((groupNodes, timeKey) => {
      if (groupNodes.length > 1) {
        const cluster = this.createCluster(`temporal-${timeKey}`, `Created: ${timeKey}`, 'temporal', groupNodes, edges);
        clusters.push(cluster);
        groupNodes.forEach((node) => processed.add(node.id));
      }
    });

    logger.debug(`Created ${String(clusters.length)} temporal-based clusters`);
    return clusters;
  }

  /**
   * Create a cluster from a group of nodes
   */
  private createCluster(
    id: string,
    name: string,
    type: Cluster['type'],
    nodes: DependencyNode[],
    edges: GraphEdge[]
  ): Cluster {
    const metrics = this.calculateClusterMetrics(nodes, edges);
    const color = this.getClusterColor(type, metrics);

    return {
      id,
      name,
      type,
      nodes,
      metrics,
      color,
    };
  }

  /**
   * Calculate cluster metrics
   */
  private calculateClusterMetrics(nodes: DependencyNode[], edges: GraphEdge[]): Cluster['metrics'] {
    const cohesion = this.calculateCohesion(nodes, edges);
    const coupling = this.calculateCoupling(nodes, edges);
    const complexity = this.calculateComplexity(nodes);

    return {
      cohesion,
      coupling,
      complexity,
      size: nodes.length,
    };
  }

  /**
   * Calculate cohesion within a cluster
   */
  private calculateCohesion(nodes: DependencyNode[], edges: GraphEdge[]): number {
    const nodeIds = new Set(nodes.map((n) => n.id));
    const internalEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    const totalPossibleEdges = (nodes.length * (nodes.length - 1)) / 2;

    return totalPossibleEdges > 0 ? internalEdges.length / totalPossibleEdges : 0;
  }

  /**
   * Calculate coupling between cluster and external nodes
   */
  private calculateCoupling(nodes: DependencyNode[], edges: GraphEdge[]): number {
    const nodeIds = new Set(nodes.map((n) => n.id));
    const externalEdges = edges.filter(
      (e) => (nodeIds.has(e.source) && !nodeIds.has(e.target)) || (!nodeIds.has(e.source) && nodeIds.has(e.target))
    );

    return externalEdges.length;
  }

  /**
   * Calculate complexity of nodes in cluster
   */
  private calculateComplexity(nodes: DependencyNode[]): number {
    return nodes.reduce((sum, node) => {
      // Simple complexity metric based on node type and data
      const baseComplexity = this.getNodeTypeComplexity(node.type ?? '');
      const dataComplexity = this.getDataComplexity(node);
      return sum + baseComplexity + dataComplexity;
    }, 0);
  }

  /**
   * Get complexity score for node type
   */
  private getNodeTypeComplexity(type: string): number {
    const complexityMap: Record<string, number> = {
      package: 1,
      module: 2,
      class: 3,
      interface: 2,
      function: 1,
      enum: 1,
      type: 1,
    };
    return complexityMap[type] ?? 1;
  }

  /**
   * Get complexity score for node data
   */
  private getDataComplexity(node: DependencyNode): number {
    const data = node.data;
    let complexity = 0;

    if (data?.methods) complexity += data.methods.length * 0.5;
    if (data?.properties) complexity += data.properties.length * 0.3;
    if (data?.imports) complexity += data.imports.length * 0.2;
    if (data?.exports) complexity += data.exports.length * 0.2;

    return complexity;
  }

  /**
   * Get cluster color based on type and metrics
   */
  private getClusterColor(type: Cluster['type'], metrics: Cluster['metrics']): string {
    const colorMap: Record<Cluster['type'], string> = {
      dependency: '#4CAF50',
      complexity: '#FF9800',
      coupling: '#F44336',
      temporal: '#2196F3',
      custom: '#9C27B0',
    };

    const baseColor = colorMap[type];

    // Adjust opacity based on cohesion
    const opacity = Math.max(0.3, Math.min(0.8, metrics.cohesion));
    return `${baseColor}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')}`;
  }

  /**
   * Calculate overall clustering metrics
   */
  private calculateMetrics(clusters: Cluster[], nodes: DependencyNode[], edges: GraphEdge[]): ClusteringMetrics {
    const totalClusters = clusters.length;
    const averageClusterSize =
      totalClusters > 0 ? clusters.reduce((sum, c) => sum + c.nodes.length, 0) / totalClusters : 0;

    const cohesionScore =
      totalClusters > 0 ? clusters.reduce((sum, c) => sum + c.metrics.cohesion, 0) / totalClusters : 0;

    const couplingScore =
      totalClusters > 0 ? clusters.reduce((sum, c) => sum + c.metrics.coupling, 0) / totalClusters : 0;

    const complexityScore =
      totalClusters > 0 ? clusters.reduce((sum, c) => sum + c.metrics.complexity, 0) / totalClusters : 0;

    // Calculate modularity (simplified)
    const modularity = this.calculateModularity(clusters, nodes, edges);

    return {
      totalClusters,
      averageClusterSize,
      cohesionScore,
      couplingScore,
      complexityScore,
      modularity,
    };
  }

  /**
   * Calculate modularity of the clustering
   */
  private calculateModularity(clusters: Cluster[], _nodes: DependencyNode[], edges: GraphEdge[]): number {
    // Simplified modularity calculation
    const totalEdges = edges.length;
    if (totalEdges === 0) return 0;

    let modularity = 0;
    clusters.forEach((cluster) => {
      const nodeIds = new Set(cluster.nodes.map((n) => n.id));
      const internalEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target)).length;

      const expectedEdges = (cluster.nodes.length * (cluster.nodes.length - 1)) / (2 * totalEdges);
      modularity += (internalEdges - expectedEdges) / totalEdges;
    });

    return modularity;
  }

  // Helper methods for dependency analysis
  private getModuleDependencies(_node: DependencyNode, _data: DependencyPackageGraph): string[] {
    // Implementation would extract dependencies from the node data
    return [];
  }

  private createDependencyKey(deps: string[]): string {
    return deps.sort().join(',');
  }

  private calculateModuleComplexity(node: DependencyNode, _data: DependencyPackageGraph): number {
    // Implementation would calculate complexity based on node structure
    return this.getDataComplexity(node);
  }

  private calculateModuleCoupling(node: DependencyNode, edges: GraphEdge[]): number {
    return edges.filter((e) => e.source === node.id || e.target === node.id).length;
  }

  private findConnectedNodes(
    node: DependencyNode,
    edges: GraphEdge[],
    couplingMap: Map<string, number>
  ): DependencyNode[] {
    const connected = new Set<string>();
    const queue = [node.id];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;
      if (connected.has(currentId)) continue;

      connected.add(currentId);

      edges.forEach((edge) => {
        if (edge.source === currentId && !connected.has(edge.target)) {
          const targetNode = this.nodeMap.get(edge.target);
          if (targetNode && (couplingMap.get(edge.target) ?? 0) > 3) {
            queue.push(edge.target);
          }
        } else if (edge.target === currentId && !connected.has(edge.source)) {
          const sourceNode = this.nodeMap.get(edge.source);
          if (sourceNode && (couplingMap.get(edge.source) ?? 0) > 3) {
            queue.push(edge.source);
          }
        }
      });
    }

    return Array.from(connected)
      .map((id) => this.nodeMap.get(id))
      .filter((node): node is DependencyNode => node !== undefined);
  }

  private getNodeCreationTime(_node: DependencyNode, _data: DependencyPackageGraph): Date {
    // Implementation would extract creation time from node data
    return new Date();
  }

  private createTemporalKey(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${String(year)}-${String(month).padStart(2, '0')}`;
  }

  private removeClusteredNodes(nodes: DependencyNode[], clusters: Cluster[]): DependencyNode[] {
    const clusteredIds = new Set(clusters.flatMap((c) => c.nodes.map((n) => n.id)));
    return nodes.filter((node) => !clusteredIds.has(node.id));
  }
}

/**
 * Factory function to create smart clustering engine
 */
export function createSmartClusteringEngine(options: ClusteringOptions): SmartClusteringEngine {
  return new SmartClusteringEngine(options);
}

/**
 * Default clustering options
 */
export const DEFAULT_CLUSTERING_OPTIONS: ClusteringOptions = {
  dependencyBased: true,
  complexityBased: true,
  couplingBased: true,
  temporalBased: false,
  customMetrics: [],
};
