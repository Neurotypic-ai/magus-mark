/**
 * Advanced Edge Visualization System
 * Edge bundling, thickness scaling, and animated flow visualization
 */

import { createLogger } from '../../shared/utils/logger';

import type { DependencyNode, GraphEdge } from '../components/DependencyGraph/types';

const logger = createLogger('EdgeVisualization');

export interface EdgeVisualizationConfig {
  // Edge bundling
  enableBundling: boolean;
  bundlingStrength: number;
  bundlingIterations: number;

  // Thickness scaling
  enableThicknessScaling: boolean;
  thicknessByStrength: boolean;
  thicknessByType: boolean;
  minThickness: number;
  maxThickness: number;

  // Animation
  enableAnimation: boolean;
  animationSpeed: number;
  animationType: 'flow' | 'pulse' | 'wave' | 'none';

  // Edge clustering
  enableEdgeClustering: boolean;
  clusterThreshold: number;

  // Visual effects
  enableGradients: boolean;
  enableShadows: boolean;
  enableGlow: boolean;
}

export interface EdgeBundle {
  id: string;
  edges: GraphEdge[];
  path: { x: number; y: number }[];
  strength: number;
  color: string;
  thickness: number;
}

export interface EdgeAnimation {
  id: string;
  edgeId: string;
  type: 'flow' | 'pulse' | 'wave';
  progress: number;
  speed: number;
  direction: 'forward' | 'backward' | 'bidirectional';
}

export interface EnhancedEdge {
  id: string;
  source: string;
  target: string;
  data?: Record<string, unknown>;
  thickness?: number;
  strength?: number;
  bundleId?: string;
  animation?: EdgeAnimation;
  gradient?: string;
  shadow?: string;
  glow?: string;
  color?: string;
  label?: string;
  type?: string;
  style?: Record<string, unknown>;
  markerEnd?: unknown;
  markerStart?: unknown;
  sourceHandle?: string;
  targetHandle?: string;
  sourceX?: number;
  sourceY?: number;
  targetX?: number;
  targetY?: number;
  path?: string;
  [key: string]: unknown;
}

/**
 * Advanced edge visualization engine
 */
export class EdgeVisualizationEngine {
  private config: EdgeVisualizationConfig;
  private bundles = new Map<string, EdgeBundle>();
  private animations = new Map<string, EdgeAnimation>();
  private animationFrame: number | null = null;

  constructor(config: EdgeVisualizationConfig) {
    this.config = config;
  }

  /**
   * Apply advanced visualization to edges
   */
  public visualizeEdges(nodes: DependencyNode[], edges: GraphEdge[]): EnhancedEdge[] {
    logger.info('Applying advanced edge visualization');

    let enhancedEdges = this.enhanceEdges(edges);

    if (this.config.enableBundling) {
      enhancedEdges = this.applyEdgeBundling(enhancedEdges, nodes);
    }

    if (this.config.enableThicknessScaling) {
      enhancedEdges = this.applyThicknessScaling(enhancedEdges);
    }

    if (this.config.enableAnimation) {
      enhancedEdges = this.applyAnimations(enhancedEdges);
    }

    if (this.config.enableEdgeClustering) {
      enhancedEdges = this.applyEdgeClustering(enhancedEdges);
    }

    if (this.config.enableGradients || this.config.enableShadows || this.config.enableGlow) {
      enhancedEdges = this.applyVisualEffects(enhancedEdges);
    }

    logger.debug(`Enhanced ${String(enhancedEdges.length)} edges with advanced visualization`);
    return enhancedEdges;
  }

  /**
   * Start edge animations
   */
  public startAnimations(): void {
    if (!this.config.enableAnimation || this.animationFrame) return;

    const animate = () => {
      this.updateAnimations();
      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
    logger.debug('Started edge animations');
  }

  /**
   * Stop edge animations
   */
  public stopAnimations(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    logger.debug('Stopped edge animations');
  }

  /**
   * Get edge bundles
   */
  public getBundles(): EdgeBundle[] {
    return Array.from(this.bundles.values());
  }

  /**
   * Get edge animations
   */
  public getAnimations(): EdgeAnimation[] {
    return Array.from(this.animations.values());
  }

  /**
   * Enhance edges with basic properties
   */
  private enhanceEdges(edges: GraphEdge[]): EnhancedEdge[] {
    return edges.map((edge) => {
      const strength = this.calculateEdgeStrength(edge);
      const thickness = this.calculateBaseThickness(edge, strength);

      return {
        ...edge,
        thickness,
        strength,
      } as EnhancedEdge;
    });
  }

  /**
   * Apply edge bundling
   */
  private applyEdgeBundling(edges: EnhancedEdge[], nodes: DependencyNode[]): EnhancedEdge[] {
    logger.debug('Applying edge bundling');

    const bundles = this.createEdgeBundles(edges, nodes);
    this.bundles.clear();

    bundles.forEach((bundle) => {
      this.bundles.set(bundle.id, bundle);
    });

    return edges.map((edge) => {
      const bundle = this.findEdgeBundle(edge, bundles);
      if (bundle) {
        return {
          ...edge,
          bundleId: bundle.id,
        };
      }
      return edge;
    });
  }

  /**
   * Apply thickness scaling
   */
  private applyThicknessScaling(edges: EnhancedEdge[]): EnhancedEdge[] {
    logger.debug('Applying thickness scaling');

    return edges.map((edge) => {
      let thickness = edge.thickness ?? this.config.minThickness;
      const strength = edge.strength ?? 0.5;

      if (this.config.thicknessByStrength) {
        thickness = this.scaleThicknessByStrength(strength);
      }

      if (this.config.thicknessByType) {
        thickness = this.scaleThicknessByType(edge, thickness);
      }

      return {
        ...edge,
        thickness: Math.max(this.config.minThickness, Math.min(thickness, this.config.maxThickness)),
      };
    });
  }

  /**
   * Apply edge animations
   */
  private applyAnimations(edges: EnhancedEdge[]): EnhancedEdge[] {
    logger.debug('Applying edge animations');

    return edges.map((edge) => {
      const animation = this.createEdgeAnimation(edge);
      if (animation) {
        this.animations.set(animation.id, animation);
        return {
          ...edge,
          animation,
        };
      }
      return edge;
    });
  }

  /**
   * Apply edge clustering
   */
  private applyEdgeClustering(edges: EnhancedEdge[]): EnhancedEdge[] {
    logger.debug('Applying edge clustering');

    const clusters = this.clusterEdges(edges);

    return edges.map((edge) => {
      const cluster = this.findEdgeCluster(edge, clusters);
      if (cluster) {
        return {
          ...edge,
          clusterId: cluster.id,
        };
      }
      return edge;
    });
  }

  /**
   * Apply visual effects
   */
  private applyVisualEffects(edges: EnhancedEdge[]): EnhancedEdge[] {
    logger.debug('Applying visual effects');

    return edges.map((edge) => {
      const effects: Partial<EnhancedEdge> = {};

      if (this.config.enableGradients) {
        effects.gradient = this.createEdgeGradient(edge);
      }

      if (this.config.enableShadows) {
        effects.shadow = this.createEdgeShadow(edge);
      }

      if (this.config.enableGlow) {
        effects.glow = this.createEdgeGlow(edge);
      }

      return {
        ...edge,
        ...effects,
      };
    });
  }

  /**
   * Calculate edge strength
   */
  private calculateEdgeStrength(edge: GraphEdge): number {
    const type = (edge.data as { type?: string } | undefined)?.type;
    const strengthMap: Record<string, number> = {
      inheritance: 1.0,
      implements: 0.8,
      uses: 0.65,
      import: 0.6,
      export: 0.6,
      dependency: 0.4,
      devDependency: 0.3,
      peerDependency: 0.5,
    };
    return strengthMap[type ?? ''] ?? 0.5;
  }

  /**
   * Calculate base thickness
   */
  private calculateBaseThickness(_edge: GraphEdge, strength: number): number {
    return this.config.minThickness + strength * (this.config.maxThickness - this.config.minThickness);
  }

  /**
   * Create edge bundles
   */
  private createEdgeBundles(edges: EnhancedEdge[], nodes: DependencyNode[]): EdgeBundle[] {
    const bundles: EdgeBundle[] = [];
    const processed = new Set<string>();

    edges.forEach((edge) => {
      if (processed.has(edge.id)) return;

      const bundle = this.createBundleForEdge(edge, edges, nodes);
      if (bundle.edges.length > 1) {
        bundles.push(bundle);
        bundle.edges.forEach((e) => processed.add(e.id));
      }
    });

    return bundles;
  }

  /**
   * Create bundle for a specific edge
   */
  private createBundleForEdge(edge: EnhancedEdge, allEdges: EnhancedEdge[], nodes: DependencyNode[]): EdgeBundle {
    const bundleEdges = [edge];
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) {
      return this.createSingleEdgeBundle(edge);
    }

    // Find edges that could be bundled with this one
    const candidateEdges = allEdges.filter(
      (e) =>
        e.id !== edge.id &&
        (e.source === edge.source || e.target === edge.target || e.source === edge.target || e.target === edge.source)
    );

    // Group by similar paths
    candidateEdges.forEach((candidate) => {
      if (this.shouldBundleEdges(edge, candidate, nodes)) {
        bundleEdges.push(candidate);
      }
    });

    return this.createBundleFromEdges(bundleEdges, nodes);
  }

  /**
   * Check if two edges should be bundled
   */
  private shouldBundleEdges(edge1: EnhancedEdge, edge2: EnhancedEdge, _nodes: DependencyNode[]): boolean {
    // Simple bundling criteria - could be more sophisticated
    const type1 = (edge1.data as { type?: string } | undefined)?.type;
    const type2 = (edge2.data as { type?: string } | undefined)?.type;

    return type1 === type2 && Math.abs((edge1.strength ?? 0.5) - (edge2.strength ?? 0.5)) < 0.3;
  }

  /**
   * Create bundle from edges
   */
  private createBundleFromEdges(edges: EnhancedEdge[], nodes: DependencyNode[]): EdgeBundle {
    const id = `bundle-${edges
      .map((e) => e.id)
      .sort()
      .join('-')}`;
    const averageStrength = edges.reduce((sum, e) => sum + (e.strength ?? 0.5), 0) / edges.length;
    const color = this.getBundleColor(averageStrength);
    const thickness = Math.max(...edges.map((e) => e.thickness ?? this.config.minThickness));

    // Create bundle path (simplified)
    const path = this.createBundlePath(edges, nodes);

    return {
      id,
      edges: edges as GraphEdge[],
      path,
      strength: averageStrength,
      color,
      thickness,
    };
  }

  /**
   * Create single edge bundle
   */
  private createSingleEdgeBundle(edge: EnhancedEdge): EdgeBundle {
    const strength = edge.strength ?? 0.5;
    const thickness = edge.thickness ?? this.config.minThickness;
    return {
      id: `bundle-${edge.id}`,
      edges: [edge] as GraphEdge[],
      path: [],
      strength,
      color: this.getBundleColor(strength),
      thickness,
    };
  }

  /**
   * Create bundle path
   */
  private createBundlePath(edges: EnhancedEdge[], nodes: DependencyNode[]): { x: number; y: number }[] {
    // Simplified path creation - in a real implementation, you'd use proper curve algorithms
    const path: { x: number; y: number }[] = [];

    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        path.push(
          { x: sourceNode.position.x, y: sourceNode.position.y },
          { x: targetNode.position.x, y: targetNode.position.y }
        );
      }
    });

    return path;
  }

  /**
   * Get bundle color
   */
  private getBundleColor(strength: number): string {
    const hue = (1 - strength) * 120; // Green to red
    return `hsl(${String(hue)}, 70%, 50%)`;
  }

  /**
   * Find edge bundle
   */
  private findEdgeBundle(edge: EnhancedEdge, bundles: EdgeBundle[]): EdgeBundle | null {
    return bundles.find((bundle) => bundle.edges.some((e) => e.id === edge.id)) ?? null;
  }

  /**
   * Scale thickness by strength
   */
  private scaleThicknessByStrength(strength: number): number {
    return this.config.minThickness + strength * (this.config.maxThickness - this.config.minThickness);
  }

  /**
   * Scale thickness by type
   */
  private scaleThicknessByType(edge: EnhancedEdge, baseThickness: number): number {
    const type = (edge.data as { type?: string } | undefined)?.type;
    const multipliers: Record<string, number> = {
      inheritance: 1.5,
      implements: 1.3,
      import: 1.0,
      export: 1.0,
      dependency: 0.8,
    };
    return baseThickness * (multipliers[type ?? ''] ?? 1.0);
  }

  /**
   * Create edge animation
   */
  private createEdgeAnimation(edge: EnhancedEdge): EdgeAnimation | null {
    if (this.config.animationType === 'none') return null;

    return {
      id: `anim-${edge.id}`,
      edgeId: edge.id,
      type: this.config.animationType,
      progress: 0,
      speed: this.config.animationSpeed,
      direction: 'forward',
    };
  }

  /**
   * Update animations
   */
  private updateAnimations(): void {
    this.animations.forEach((animation) => {
      animation.progress += animation.speed;
      if (animation.progress > 1) {
        animation.progress = 0;
      }
    });
  }

  /**
   * Cluster edges
   */
  private clusterEdges(edges: EnhancedEdge[]): { id: string; edges: EnhancedEdge[] }[] {
    const clusters: { id: string; edges: EnhancedEdge[] }[] = [];
    const processed = new Set<string>();

    edges.forEach((edge) => {
      if (processed.has(edge.id)) return;

      const cluster = this.createEdgeCluster(edge, edges);
      if (cluster.edges.length > 1) {
        clusters.push(cluster);
        cluster.edges.forEach((e) => processed.add(e.id));
      }
    });

    return clusters;
  }

  /**
   * Create edge cluster
   */
  private createEdgeCluster(edge: EnhancedEdge, allEdges: EnhancedEdge[]): { id: string; edges: EnhancedEdge[] } {
    const clusterEdges = [edge];
    const type = (edge.data as { type?: string } | undefined)?.type;

    allEdges.forEach((otherEdge) => {
      if (otherEdge.id === edge.id) return;

      const otherType = (otherEdge.data as { type?: string } | undefined)?.type;
      if (
        type === otherType &&
        Math.abs((edge.strength ?? 0.5) - (otherEdge.strength ?? 0.5)) < this.config.clusterThreshold
      ) {
        clusterEdges.push(otherEdge);
      }
    });

    return {
      id: `cluster-${clusterEdges
        .map((e) => e.id)
        .sort()
        .join('-')}`,
      edges: clusterEdges,
    };
  }

  /**
   * Find edge cluster
   */
  private findEdgeCluster(
    edge: EnhancedEdge,
    clusters: { id: string; edges: EnhancedEdge[] }[]
  ): { id: string; edges: EnhancedEdge[] } | null {
    return clusters.find((cluster) => cluster.edges.some((e) => e.id === edge.id)) ?? null;
  }

  /**
   * Create edge gradient
   */
  private createEdgeGradient(edge: EnhancedEdge): string {
    const strength = edge.strength ?? 0.5;
    const opacity = 0.3 + strength * 0.7;
    return `linear-gradient(90deg, rgba(0,0,0,${String(opacity)}) 0%, rgba(0,0,0,${String(opacity * 0.5)}) 100%)`;
  }

  /**
   * Create edge shadow
   */
  private createEdgeShadow(edge: EnhancedEdge): string {
    const strength = edge.strength ?? 0.5;
    const blur = 2 + strength * 4;
    const opacity = 0.1 + strength * 0.3;
    return `0 0 ${String(blur)}px rgba(0,0,0,${String(opacity)})`;
  }

  /**
   * Create edge glow
   */
  private createEdgeGlow(edge: EnhancedEdge): string {
    const strength = edge.strength ?? 0.5;
    const intensity = 0.2 + strength * 0.8;
    const color = this.getBundleColor(strength);
    return `0 0 ${String(4 + strength * 8)}px ${color}${Math.round(intensity * 255)
      .toString(16)
      .padStart(2, '0')}`;
  }
}

/**
 * Factory function to create edge visualization engine
 */
export function createEdgeVisualizationEngine(config: EdgeVisualizationConfig): EdgeVisualizationEngine {
  return new EdgeVisualizationEngine(config);
}

/**
 * Default edge visualization configuration
 */
export const DEFAULT_EDGE_CONFIG: EdgeVisualizationConfig = {
  enableBundling: true,
  bundlingStrength: 0.5,
  bundlingIterations: 10,
  enableThicknessScaling: true,
  thicknessByStrength: true,
  thicknessByType: true,
  minThickness: 1,
  maxThickness: 8,
  enableAnimation: true,
  animationSpeed: 0.02,
  animationType: 'flow',
  enableEdgeClustering: true,
  clusterThreshold: 0.3,
  enableGradients: true,
  enableShadows: true,
  enableGlow: false,
};
