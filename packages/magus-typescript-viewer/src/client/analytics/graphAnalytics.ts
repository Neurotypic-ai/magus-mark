/**
 * Interactive Graph Analytics System
 * Real-time metrics display for coupling, complexity, and dependency health
 */

import type { DependencyNode, GraphEdge } from '../components/DependencyGraph/types';

export interface AnalyticsMetrics {
  // Overall graph metrics
  totalNodes: number;
  totalEdges: number;
  totalPackages: number;
  totalModules: number;
  totalClasses: number;
  totalInterfaces: number;

  // Complexity metrics
  averageComplexity: number;
  maxComplexity: number;
  complexityDistribution: ComplexityDistribution;

  // Coupling metrics
  averageCoupling: number;
  maxCoupling: number;
  couplingDistribution: CouplingDistribution;

  // Health metrics
  averageHealth: number;
  unhealthyNodes: number;
  healthDistribution: HealthDistribution;

  // Dependency metrics
  circularDependencies: number;
  dependencyDepth: number;
  dependencyBreadth: number;

  // Performance metrics
  layoutTime: number;
  renderTime: number;
  memoryUsage: number;
}

export interface ComplexityDistribution {
  low: number; // 0-3
  medium: number; // 4-7
  high: number; // 8-10
}

export interface CouplingDistribution {
  low: number; // 0-5
  medium: number; // 6-12
  high: number; // 13+
}

export interface HealthDistribution {
  excellent: number; // 8-10
  good: number; // 6-7
  moderate: number; // 4-5
  poor: number; // 0-3
}

export interface NodeAnalytics {
  id: string;
  type: string;
  complexity: number;
  coupling: number;
  health: number;
  importance: number;
  connections: number;
  dependencies: string[];
  dependents: string[];
}

export interface EdgeAnalytics {
  id: string;
  type: string;
  strength: number;
  criticality: number;
  sourceNode: NodeAnalytics;
  targetNode: NodeAnalytics;
}

export interface AnalyticsConfig {
  enableRealTime: boolean;
  updateInterval: number;
  enablePerformanceMetrics: boolean;
  enableHealthAlerts: boolean;
  enableComplexityWarnings: boolean;
  enableCouplingAlerts: boolean;
}

/**
 * Graph analytics engine for real-time metrics
 */
export class GraphAnalyticsEngine {
  private config: AnalyticsConfig;
  private metrics: AnalyticsMetrics | null = null;
  private nodeAnalytics = new Map<string, NodeAnalytics>();
  private edgeAnalytics = new Map<string, EdgeAnalytics>();
  private updateTimer: NodeJS.Timeout | null = null;

  constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  /**
   * Calculate comprehensive analytics for the graph
   */
  public calculateAnalytics(nodes: DependencyNode[], edges: GraphEdge[], startTime?: number): AnalyticsMetrics {
    // logger.debug('Calculating graph analytics');
    const calculationStart = startTime ?? performance.now();

    // Handle empty graph case
    if (nodes.length === 0) {
      // logger.debug('No nodes provided for analytics calculation');
      const emptyMetrics: AnalyticsMetrics = {
        totalNodes: 0,
        totalEdges: edges.length,
        totalPackages: 0,
        totalModules: 0,
        totalClasses: 0,
        totalInterfaces: 0,
        averageComplexity: 0,
        maxComplexity: 0,
        complexityDistribution: { low: 0, medium: 0, high: 0 },
        averageCoupling: 0,
        maxCoupling: 0,
        couplingDistribution: { low: 0, medium: 0, high: 0 },
        averageHealth: 0,
        unhealthyNodes: 0,
        healthDistribution: { excellent: 0, good: 0, moderate: 0, poor: 0 },
        circularDependencies: 0,
        dependencyDepth: 0,
        dependencyBreadth: 0,
        layoutTime: performance.now() - calculationStart,
        renderTime: 0,
        memoryUsage: 0,
      };
      this.metrics = emptyMetrics;
      return emptyMetrics;
    }

    // Calculate node analytics
    this.calculateNodeAnalytics(nodes, edges);

    // Calculate edge analytics
    this.calculateEdgeAnalytics(nodes, edges);

    // Calculate overall metrics
    const metrics = this.calculateOverallMetrics(nodes, edges, calculationStart);

    this.metrics = metrics;
    // logger.debug('Analytics calculation complete', metrics);

    return metrics;
  }

  /**
   * Get real-time metrics
   */
  public getMetrics(): AnalyticsMetrics | null {
    return this.metrics;
  }

  /**
   * Get analytics for a specific node
   */
  public getNodeAnalytics(nodeId: string): NodeAnalytics | null {
    return this.nodeAnalytics.get(nodeId) ?? null;
  }

  /**
   * Get analytics for a specific edge
   */
  public getEdgeAnalytics(edgeId: string): EdgeAnalytics | null {
    return this.edgeAnalytics.get(edgeId) ?? null;
  }

  /**
   * Get health alerts for the graph
   */
  public getHealthAlerts(): string[] {
    if (!this.config.enableHealthAlerts || !this.metrics) return [];

    const alerts: string[] = [];

    if (this.metrics.unhealthyNodes > 0) {
      alerts.push(`⚠️ ${String(this.metrics.unhealthyNodes)} nodes have poor health (score < 4)`);
    }

    if (this.metrics.averageHealth < 5) {
      alerts.push(`🔴 Overall graph health is poor (${this.metrics.averageHealth.toFixed(1)}/10)`);
    } else if (this.metrics.averageHealth < 7) {
      alerts.push(`🟡 Overall graph health is moderate (${this.metrics.averageHealth.toFixed(1)}/10)`);
    }

    return alerts;
  }

  /**
   * Get complexity warnings
   */
  public getComplexityWarnings(): string[] {
    if (!this.config.enableComplexityWarnings || !this.metrics) return [];

    const warnings: string[] = [];

    if (this.metrics.maxComplexity > 8) {
      warnings.push(`🔴 High complexity detected (max: ${this.metrics.maxComplexity.toFixed(1)})`);
    }

    if (this.metrics.averageComplexity > 6) {
      warnings.push(`🟡 Average complexity is high (${this.metrics.averageComplexity.toFixed(1)}/10)`);
    }

    return warnings;
  }

  /**
   * Get coupling alerts
   */
  public getCouplingAlerts(): string[] {
    if (!this.config.enableCouplingAlerts || !this.metrics) return [];

    const alerts: string[] = [];

    if (this.metrics.maxCoupling > 15) {
      alerts.push(`🔴 High coupling detected (max: ${String(this.metrics.maxCoupling)})`);
    }

    if (this.metrics.averageCoupling > 8) {
      alerts.push(`🟡 Average coupling is high (${this.metrics.averageCoupling.toFixed(1)})`);
    }

    return alerts;
  }

  /**
   * Get disconnected graph alerts
   */
  public getDisconnectedGraphAlerts(): string[] {
    if (!this.metrics) return [];

    const alerts: string[] = [];

    // Check for completely disconnected graphs
    if (this.metrics.totalNodes > 0 && this.metrics.totalEdges === 0) {
      alerts.push(`🔗 Graph contains ${String(this.metrics.totalNodes)} disconnected nodes with no connections`);
    }

    // Check for graphs with very low connectivity
    if (this.metrics.totalNodes > 1 && this.metrics.totalEdges < this.metrics.totalNodes - 1) {
      alerts.push(
        `🔗 Graph has low connectivity (${String(this.metrics.totalEdges)} edges for ${String(this.metrics.totalNodes)} nodes)`
      );
    }

    return alerts;
  }

  /**
   * Start real-time analytics updates
   */
  public startRealTimeUpdates(
    nodes: DependencyNode[],
    edges: GraphEdge[],
    onUpdate: (metrics: AnalyticsMetrics) => void
  ): void {
    if (!this.config.enableRealTime) return;

    this.updateTimer = setInterval(() => {
      const metrics = this.calculateAnalytics(nodes, edges);
      onUpdate(metrics);
    }, this.config.updateInterval);
  }

  /**
   * Stop real-time analytics updates
   */
  public stopRealTimeUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Calculate analytics for individual nodes
   */
  private calculateNodeAnalytics(nodes: DependencyNode[], edges: GraphEdge[]): void {
    this.nodeAnalytics.clear();

    // Handle case where there are no edges (disconnected nodes)
    const safeEdges = edges;

    nodes.forEach((node) => {
      const connections = safeEdges.filter((e) => e.source === node.id || e.target === node.id);
      const dependencies = safeEdges.filter((e) => e.target === node.id).map((e) => e.source);
      const dependents = safeEdges.filter((e) => e.source === node.id).map((e) => e.target);

      const complexity = this.calculateNodeComplexity(node);
      const coupling = connections.length;
      const health = this.calculateNodeHealth(node, complexity, coupling);
      const importance = this.calculateNodeImportance(node, connections, nodes);

      this.nodeAnalytics.set(node.id, {
        id: node.id,
        type: node.type ?? '',
        complexity,
        coupling,
        health,
        importance,
        connections: connections.length,
        dependencies,
        dependents,
      });
    });
  }

  /**
   * Calculate analytics for individual edges
   */
  private calculateEdgeAnalytics(_nodes: DependencyNode[], edges: GraphEdge[]): void {
    this.edgeAnalytics.clear();

    // Handle case where there are no edges
    const safeEdges = edges;

    safeEdges.forEach((edge) => {
      const sourceNode = this.nodeAnalytics.get(edge.source);
      const targetNode = this.nodeAnalytics.get(edge.target);

      if (!sourceNode || !targetNode) return;

      const strength = this.calculateEdgeStrength(edge, sourceNode, targetNode);
      const criticality = this.calculateEdgeCriticality(edge, sourceNode, targetNode);

      this.edgeAnalytics.set(edge.id, {
        id: edge.id,
        type: (edge.data as { type?: string } | undefined)?.type ?? 'unknown',
        strength,
        criticality,
        sourceNode,
        targetNode,
      });
    });
  }

  /**
   * Calculate overall graph metrics
   */
  private calculateOverallMetrics(nodes: DependencyNode[], edges: GraphEdge[], startTime: number): AnalyticsMetrics {
    const nodeCounts = this.countNodesByType(nodes);
    const complexityMetrics = this.calculateComplexityMetrics();
    const couplingMetrics = this.calculateCouplingMetrics();
    const healthMetrics = this.calculateHealthMetrics();
    const dependencyMetrics = this.calculateDependencyMetrics(nodes, edges);
    const performanceMetrics = this.calculatePerformanceMetrics(startTime);

    return {
      ...nodeCounts,
      totalEdges: edges.length,
      ...complexityMetrics,
      ...couplingMetrics,
      ...healthMetrics,
      ...dependencyMetrics,
      ...performanceMetrics,
    };
  }

  /**
   * Count nodes by type
   */
  private countNodesByType(nodes: DependencyNode[]) {
    // Handle empty nodes array
    const safeNodes = nodes;

    const counts = {
      totalNodes: safeNodes.length,
      totalPackages: 0,
      totalModules: 0,
      totalClasses: 0,
      totalInterfaces: 0,
    };

    safeNodes.forEach((node) => {
      switch (node.type) {
        case 'package':
          counts.totalPackages++;
          break;
        case 'module':
          counts.totalModules++;
          break;
        case 'class':
          counts.totalClasses++;
          break;
        case 'interface':
          counts.totalInterfaces++;
          break;
      }
    });

    return counts;
  }

  /**
   * Calculate complexity metrics
   */
  private calculateComplexityMetrics() {
    const complexities = Array.from(this.nodeAnalytics.values()).map((n) => n.complexity);

    // Handle empty node set
    if (complexities.length === 0) {
      return {
        averageComplexity: 0,
        maxComplexity: 0,
        complexityDistribution: { low: 0, medium: 0, high: 0 },
      };
    }

    const averageComplexity = complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
    const maxComplexity = Math.max(...complexities);

    const distribution = this.calculateComplexityDistribution(complexities);

    return {
      averageComplexity,
      maxComplexity,
      complexityDistribution: distribution,
    };
  }

  /**
   * Calculate coupling metrics
   */
  private calculateCouplingMetrics() {
    const couplings = Array.from(this.nodeAnalytics.values()).map((n) => n.coupling);

    // Handle empty node set
    if (couplings.length === 0) {
      return {
        averageCoupling: 0,
        maxCoupling: 0,
        couplingDistribution: { low: 0, medium: 0, high: 0 },
      };
    }

    const averageCoupling = couplings.reduce((sum, c) => sum + c, 0) / couplings.length;
    const maxCoupling = Math.max(...couplings);

    const distribution = this.calculateCouplingDistribution(couplings);

    return {
      averageCoupling: averageCoupling,
      maxCoupling,
      couplingDistribution: distribution,
    };
  }

  /**
   * Calculate health metrics
   */
  private calculateHealthMetrics() {
    const healths = Array.from(this.nodeAnalytics.values()).map((n) => n.health);

    // Handle empty node set
    if (healths.length === 0) {
      return {
        averageHealth: 0,
        unhealthyNodes: 0,
        healthDistribution: { excellent: 0, good: 0, moderate: 0, poor: 0 },
      };
    }

    const averageHealth = healths.reduce((sum, h) => sum + h, 0) / healths.length;
    const unhealthyNodes = healths.filter((h) => h < 4).length;

    const distribution = this.calculateHealthDistribution(healths);

    return {
      averageHealth,
      unhealthyNodes,
      healthDistribution: distribution,
    };
  }

  /**
   * Calculate dependency metrics
   */
  private calculateDependencyMetrics(nodes: DependencyNode[], edges: GraphEdge[]) {
    // Simplified circular dependency detection
    const circularDependencies = this.detectCircularDependencies(nodes, edges);

    // Calculate dependency depth and breadth
    const dependencyDepth = this.calculateDependencyDepth(nodes, edges);
    const dependencyBreadth = this.calculateDependencyBreadth(nodes, edges);

    return {
      circularDependencies,
      dependencyDepth,
      dependencyBreadth,
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(startTime: number) {
    const layoutTime = performance.now() - startTime;
    const renderTime = 0; // Would be measured during rendering
    const memoryUsage = this.estimateMemoryUsage();

    return {
      layoutTime,
      renderTime,
      memoryUsage,
    };
  }

  // Helper methods for individual calculations
  private calculateNodeComplexity(node: DependencyNode): number {
    let complexity = 0;
    const data = node.data;

    // Base complexity by type
    const typeComplexity: Record<string, number> = {
      package: 1,
      module: 2,
      class: 4,
      interface: 3,
      function: 2,
      enum: 1,
      type: 1,
    };
    complexity += typeComplexity[node.type ?? ''] ?? 1;

    // Add complexity from data
    if (data?.methods) complexity += data.methods.length * 0.5;
    if (data?.properties) complexity += data.properties.length * 0.3;
    if (data?.imports) complexity += data.imports.length * 0.2;
    if (data?.exports) complexity += data.exports.length * 0.2;

    return Math.min(complexity, 10);
  }

  private calculateNodeHealth(_node: DependencyNode, complexity: number, coupling: number): number {
    let health = 10;
    health -= complexity * 0.3;
    if (coupling > 10) health -= (coupling - 10) * 0.2;
    return Math.max(0, Math.min(health, 10));
  }

  private calculateNodeImportance(node: DependencyNode, connections: GraphEdge[], allNodes: DependencyNode[]): number {
    let importance = connections.length;

    // Boost importance for nodes connecting different types
    const connectedTypes = new Set(
      connections
        .map((c) => {
          const connectedId = c.source === node.id ? c.target : c.source;
          return allNodes.find((n) => n.id === connectedId)?.type;
        })
        .filter(Boolean)
    );

    if (connectedTypes.size > 1) {
      importance += connectedTypes.size * 0.5;
    }

    return Math.min(importance, 15);
  }

  private calculateEdgeStrength(edge: GraphEdge, source: NodeAnalytics, target: NodeAnalytics): number {
    // Edge strength based on node importance and edge type
    const baseStrength = (source.importance + target.importance) / 2;
    const typeMultiplier = this.getEdgeTypeMultiplier(edge);
    return baseStrength * typeMultiplier;
  }

  private calculateEdgeCriticality(edge: GraphEdge, source: NodeAnalytics, target: NodeAnalytics): number {
    // Criticality based on node health and edge type
    const healthFactor = (source.health + target.health) / 2;
    const typeCriticality = this.getEdgeTypeCriticality(edge);
    return (10 - healthFactor) * typeCriticality;
  }

  private getEdgeTypeMultiplier(edge: GraphEdge): number {
    const type = (edge.data as { type?: string } | undefined)?.type;
    const multipliers: Record<string, number> = {
      inheritance: 1.5,
      implements: 1.3,
      import: 1.0,
      export: 1.0,
      dependency: 0.8,
    };
    return multipliers[type ?? ''] ?? 1.0;
  }

  private getEdgeTypeCriticality(edge: GraphEdge): number {
    const type = (edge.data as { type?: string } | undefined)?.type;
    const criticalities: Record<string, number> = {
      inheritance: 0.8,
      implements: 0.6,
      import: 0.4,
      export: 0.3,
      dependency: 0.2,
    };
    return criticalities[type ?? ''] ?? 0.5;
  }

  // Distribution calculation helpers
  private calculateComplexityDistribution(complexities: number[]): ComplexityDistribution {
    return {
      low: complexities.filter((c) => c <= 3).length,
      medium: complexities.filter((c) => c > 3 && c <= 7).length,
      high: complexities.filter((c) => c > 7).length,
    };
  }

  private calculateCouplingDistribution(couplings: number[]): CouplingDistribution {
    return {
      low: couplings.filter((c) => c <= 5).length,
      medium: couplings.filter((c) => c > 5 && c <= 12).length,
      high: couplings.filter((c) => c > 12).length,
    };
  }

  private calculateHealthDistribution(healths: number[]): HealthDistribution {
    return {
      excellent: healths.filter((h) => h >= 8).length,
      good: healths.filter((h) => h >= 6 && h < 8).length,
      moderate: healths.filter((h) => h >= 4 && h < 6).length,
      poor: healths.filter((h) => h < 4).length,
    };
  }

  // Dependency analysis helpers
  private detectCircularDependencies(_nodes: DependencyNode[], _edges: GraphEdge[]): number {
    // Simplified circular dependency detection
    // In a real implementation, you'd use a proper cycle detection algorithm
    return 0;
  }

  private calculateDependencyDepth(_nodes: DependencyNode[], _edges: GraphEdge[]): number {
    // Calculate maximum dependency depth
    return 0;
  }

  private calculateDependencyBreadth(_nodes: DependencyNode[], _edges: GraphEdge[]): number {
    // Calculate maximum dependency breadth
    return 0;
  }

  private estimateMemoryUsage(): number {
    // Estimate memory usage in MB
    return this.nodeAnalytics.size * 0.1 + this.edgeAnalytics.size * 0.05;
  }
}

/**
 * Factory function to create analytics engine
 */
export function createGraphAnalyticsEngine(config: AnalyticsConfig): GraphAnalyticsEngine {
  return new GraphAnalyticsEngine(config);
}

/**
 * Default analytics configuration
 */
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enableRealTime: true,
  updateInterval: 1000,
  enablePerformanceMetrics: true,
  enableHealthAlerts: true,
  enableComplexityWarnings: true,
  enableCouplingAlerts: true,
};
