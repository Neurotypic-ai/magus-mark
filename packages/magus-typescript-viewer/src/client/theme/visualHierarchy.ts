/**
 * Visual Hierarchy System
 * Enhanced node sizing, coloring, and visual indicators based on complexity and coupling
 */

import { createLogger } from '../../shared/utils/logger';

import type { DependencyNode, GraphEdge } from '../components/DependencyGraph/types';

const logger = createLogger('VisualHierarchy');

export interface VisualMetrics {
  complexity: number;
  coupling: number;
  importance: number;
  health: number;
}

export interface VisualConfig {
  // Size scaling
  sizeByComplexity: boolean;
  sizeByCoupling: boolean;
  sizeByImportance: boolean;

  // Color coding
  colorByComplexity: boolean;
  colorByCoupling: boolean;
  colorByHealth: boolean;

  // Visual indicators
  showComplexityBadge: boolean;
  showCouplingIndicator: boolean;
  showHealthIndicator: boolean;
  showImportanceGlow: boolean;

  // Scaling factors
  sizeMultiplier: number;
  colorIntensity: number;
  indicatorSize: number;
}

export interface EnhancedNodeStyle {
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  boxShadow: string;
  opacity: number;
  indicators: VisualIndicator[];
}

export interface VisualIndicator {
  type: 'complexity' | 'coupling' | 'health' | 'importance';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  color: string;
  size: number;
  content: string;
}

/**
 * Visual hierarchy engine for enhanced node styling
 */
export class VisualHierarchyEngine {
  private config: VisualConfig;
  private nodeMetrics = new Map<string, VisualMetrics>();

  constructor(config: VisualConfig) {
    this.config = config;
  }

  /**
   * Calculate visual metrics for all nodes
   */
  public calculateMetrics(nodes: DependencyNode[], edges: GraphEdge[]): void {
    logger.info('Calculating visual metrics');

    this.nodeMetrics.clear();

    nodes.forEach((node) => {
      const metrics = this.calculateNodeMetrics(node, nodes, edges);
      this.nodeMetrics.set(node.id, metrics);
    });

    logger.debug(`Calculated metrics for ${String(this.nodeMetrics.size)} nodes`);
  }

  /**
   * Apply visual hierarchy to nodes
   */
  public applyVisualHierarchy(nodes: DependencyNode[]): DependencyNode[] {
    logger.info('Applying visual hierarchy');

    return nodes.map((node) => {
      const metrics = this.nodeMetrics.get(node.id);
      if (!metrics) return node;

      const enhancedStyle = this.createEnhancedStyle(node, metrics);

      return {
        ...node,
        style: {
          ...(node.style && typeof node.style === 'object' ? node.style : {}),
          // Note: Do not set width/height here - VueFlow manages these internally
          // Setting them causes recursive update loops
          backgroundColor: enhancedStyle.backgroundColor,
          borderColor: enhancedStyle.borderColor,
          borderWidth: `${String(enhancedStyle.borderWidth)}px`,
          boxShadow: enhancedStyle.boxShadow,
          opacity: enhancedStyle.opacity,
        },
        data: {
          ...node.data,
          label: node.data?.label ?? '',
          visualMetrics: metrics,
          enhancedStyle,
        },
      };
    });
  }

  /**
   * Calculate metrics for a single node
   */
  private calculateNodeMetrics(node: DependencyNode, allNodes: DependencyNode[], edges: GraphEdge[]): VisualMetrics {
    const complexity = this.calculateComplexity(node);
    const coupling = this.calculateCoupling(node, edges);
    const importance = this.calculateImportance(node, allNodes, edges);
    const health = this.calculateHealth(node, complexity, coupling);

    return { complexity, coupling, importance, health };
  }

  /**
   * Calculate node complexity
   */
  private calculateComplexity(node: DependencyNode): number {
    let complexity = 0;
    const data = node.data;

    // Base complexity by node type
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

    return Math.min(complexity, 10); // Cap at 10
  }

  /**
   * Calculate node coupling
   */
  private calculateCoupling(node: DependencyNode, edges: GraphEdge[]): number {
    const connectedEdges = edges.filter((e) => e.source === node.id || e.target === node.id);
    return Math.min(connectedEdges.length, 20); // Cap at 20
  }

  /**
   * Calculate node importance (centrality)
   */
  private calculateImportance(node: DependencyNode, allNodes: DependencyNode[], edges: GraphEdge[]): number {
    // Simple centrality calculation based on connections
    const connectedNodes = new Set<string>();

    edges.forEach((edge) => {
      if (edge.source === node.id) connectedNodes.add(edge.target);
      if (edge.target === node.id) connectedNodes.add(edge.source);
    });

    // Calculate betweenness centrality (simplified)
    let importance = connectedNodes.size;

    // Boost importance for nodes that connect different clusters
    const connectedTypes = new Set(
      Array.from(connectedNodes)
        .map((id) => allNodes.find((n) => n.id === id)?.type)
        .filter(Boolean)
    );

    if (connectedTypes.size > 1) {
      importance += connectedTypes.size * 0.5;
    }

    return Math.min(importance, 15); // Cap at 15
  }

  /**
   * Calculate node health
   */
  private calculateHealth(node: DependencyNode, complexity: number, coupling: number): number {
    // Health is inversely related to complexity and coupling
    // But also considers node type and structure
    let health = 10; // Start with perfect health

    // Reduce health based on complexity
    health -= complexity * 0.3;

    // Reduce health based on excessive coupling
    if (coupling > 10) {
      health -= (coupling - 10) * 0.2;
    }

    // Boost health for well-structured nodes
    const data = node.data;
    if (data?.methods && data.methods.length > 0 && data.methods.length < 10) {
      health += 1; // Well-sized methods
    }
    if (data?.properties && data.properties.length > 0 && data.properties.length < 20) {
      health += 0.5; // Reasonable number of properties
    }

    return Math.max(0, Math.min(health, 10)); // Clamp between 0 and 10
  }

  /**
   * Create enhanced style for a node
   */
  private createEnhancedStyle(node: DependencyNode, metrics: VisualMetrics): EnhancedNodeStyle {
    const baseWidth = 200;
    const baseHeight = 100;

    // Calculate size based on metrics
    let width = baseWidth;
    let height = baseHeight;

    if (this.config.sizeByComplexity) {
      const complexityScale = 1 + (metrics.complexity / 10) * 0.5;
      width *= complexityScale;
      height *= complexityScale;
    }

    if (this.config.sizeByCoupling) {
      const couplingScale = 1 + (metrics.coupling / 20) * 0.3;
      width *= couplingScale;
      height *= couplingScale;
    }

    if (this.config.sizeByImportance) {
      const importanceScale = 1 + (metrics.importance / 15) * 0.4;
      width *= importanceScale;
      height *= importanceScale;
    }

    // Apply size multiplier
    width *= this.config.sizeMultiplier;
    height *= this.config.sizeMultiplier;

    // Calculate colors
    const backgroundColor = this.calculateBackgroundColor(node, metrics);
    const borderColor = this.calculateBorderColor(node, metrics);
    const borderWidth = this.calculateBorderWidth(metrics);

    // Calculate visual effects
    const boxShadow = this.calculateBoxShadow(metrics);
    const opacity = this.calculateOpacity(metrics);

    // Create visual indicators
    const indicators = this.createVisualIndicators(node, metrics);

    return {
      width: Math.round(width),
      height: Math.round(height),
      backgroundColor,
      borderColor,
      borderWidth,
      boxShadow,
      opacity,
      indicators,
    };
  }

  /**
   * Calculate background color based on metrics
   */
  private calculateBackgroundColor(node: DependencyNode, metrics: VisualMetrics): string {
    let baseColor = this.getNodeTypeColor(node.type ?? '');

    if (this.config.colorByComplexity) {
      const complexityHue = this.mapToHue(metrics.complexity, 0, 10, 120, 0); // Green to red
      baseColor = this.adjustColorHue(baseColor, complexityHue, this.config.colorIntensity);
    }

    if (this.config.colorByCoupling) {
      const couplingSaturation = this.mapToRange(metrics.coupling, 0, 20, 0.3, 1.0);
      baseColor = this.adjustColorSaturation(baseColor, couplingSaturation);
    }

    if (this.config.colorByHealth) {
      const healthAlpha = this.mapToRange(metrics.health, 0, 10, 0.6, 1.0);
      baseColor = this.adjustColorAlpha(baseColor, healthAlpha);
    }

    return baseColor;
  }

  /**
   * Calculate border color based on metrics
   */
  private calculateBorderColor(_node: DependencyNode, metrics: VisualMetrics): string {
    if (metrics.health < 3) return '#ff4444'; // Red for unhealthy
    if (metrics.health < 6) return '#ffaa44'; // Orange for moderate health
    if (metrics.health < 8) return '#44aa44'; // Green for good health
    return '#4444ff'; // Blue for excellent health
  }

  /**
   * Calculate border width based on metrics
   */
  private calculateBorderWidth(metrics: VisualMetrics): number {
    let width = 1;

    if (metrics.importance > 8) width += 2; // Thicker border for important nodes
    if (metrics.health < 3) width += 1; // Thicker border for unhealthy nodes

    return width;
  }

  /**
   * Calculate box shadow based on metrics
   */
  private calculateBoxShadow(metrics: VisualMetrics): string {
    if (!this.config.showImportanceGlow) return 'none';

    const glowIntensity = this.mapToRange(metrics.importance, 0, 15, 0, 0.8);
    const glowColor = this.getGlowColor(metrics);

    return `0 0 ${String(Math.round(10 * glowIntensity))}px ${glowColor}`;
  }

  /**
   * Calculate opacity based on metrics
   */
  private calculateOpacity(metrics: VisualMetrics): number {
    let opacity = 1.0;

    // Reduce opacity for very complex nodes
    if (metrics.complexity > 8) {
      opacity -= 0.2;
    }

    // Reduce opacity for unhealthy nodes
    if (metrics.health < 4) {
      opacity -= 0.3;
    }

    return Math.max(0.3, opacity);
  }

  /**
   * Create visual indicators for a node
   */
  private createVisualIndicators(_node: DependencyNode, metrics: VisualMetrics): VisualIndicator[] {
    const indicators: VisualIndicator[] = [];

    if (this.config.showComplexityBadge && metrics.complexity > 5) {
      indicators.push({
        type: 'complexity',
        position: 'top-right',
        color: this.getComplexityColor(metrics.complexity),
        size: this.config.indicatorSize,
        content: `C${String(Math.round(metrics.complexity))}`,
      });
    }

    if (this.config.showCouplingIndicator && metrics.coupling > 8) {
      indicators.push({
        type: 'coupling',
        position: 'top-left',
        color: this.getCouplingColor(metrics.coupling),
        size: this.config.indicatorSize,
        content: `L${String(Math.round(metrics.coupling))}`,
      });
    }

    if (this.config.showHealthIndicator && metrics.health < 6) {
      indicators.push({
        type: 'health',
        position: 'bottom-right',
        color: this.getHealthColor(metrics.health),
        size: this.config.indicatorSize,
        content: `H${String(Math.round(metrics.health))}`,
      });
    }

    return indicators;
  }

  // Helper methods for color calculations
  private getNodeTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
      package: '#2d3748',
      module: '#4a5568',
      class: '#2b6cb0',
      interface: '#2d5016',
      function: '#744210',
      enum: '#553c9a',
      type: '#702459',
    };
    return colorMap[type] ?? '#4a5568';
  }

  private mapToHue(value: number, min: number, max: number, hueMin: number, hueMax: number): number {
    const normalized = (value - min) / (max - min);
    return hueMin + (hueMax - hueMin) * normalized;
  }

  private mapToRange(value: number, min: number, max: number, outMin: number, outMax: number): number {
    const normalized = (value - min) / (max - min);
    return outMin + (outMax - outMin) * normalized;
  }

  private adjustColorHue(color: string, _hue: number, _intensity: number): string {
    // Simplified color adjustment - in a real implementation, you'd use a proper color library
    return color;
  }

  private adjustColorSaturation(color: string, _saturation: number): string {
    // Simplified color adjustment
    return color;
  }

  private adjustColorAlpha(color: string, _alpha: number): string {
    // Simplified alpha adjustment
    return color;
  }

  private getGlowColor(metrics: VisualMetrics): string {
    if (metrics.health < 3) return '#ff4444';
    if (metrics.health < 6) return '#ffaa44';
    if (metrics.health < 8) return '#44aa44';
    return '#4444ff';
  }

  private getComplexityColor(complexity: number): string {
    if (complexity < 3) return '#44aa44';
    if (complexity < 6) return '#ffaa44';
    return '#ff4444';
  }

  private getCouplingColor(coupling: number): string {
    if (coupling < 5) return '#44aa44';
    if (coupling < 10) return '#ffaa44';
    return '#ff4444';
  }

  private getHealthColor(health: number): string {
    if (health < 3) return '#ff4444';
    if (health < 6) return '#ffaa44';
    return '#44aa44';
  }
}

/**
 * Factory function to create visual hierarchy engine
 */
export function createVisualHierarchyEngine(config: VisualConfig): VisualHierarchyEngine {
  return new VisualHierarchyEngine(config);
}

/**
 * Default visual configuration
 */
export const DEFAULT_VISUAL_CONFIG: VisualConfig = {
  sizeByComplexity: true,
  sizeByCoupling: false,
  sizeByImportance: true,
  colorByComplexity: true,
  colorByCoupling: false,
  colorByHealth: true,
  showComplexityBadge: true,
  showCouplingIndicator: true,
  showHealthIndicator: true,
  showImportanceGlow: true,
  sizeMultiplier: 1.0,
  colorIntensity: 0.7,
  indicatorSize: 12,
};
