/**
 * Multi-Algorithm Layout Engine
 * Combines different layout algorithms for optimal visualization of different node types
 */

import type * as dagre from '@dagrejs/dagre';
import type { Edge } from '@vue-flow/core';

import type { DependencyNode } from '../components/DependencyGraph/types';
import type { GraphTheme } from '../theme/graphTheme';

export interface LayoutStrategy {
  packages: 'force-directed' | 'hierarchical' | 'circular';
  modules: 'hierarchical' | 'grid' | 'force-directed';
  classes: 'grid' | 'hierarchical' | 'force-directed';
  interfaces: 'grid' | 'hierarchical';
  groups: 'hierarchical' | 'grid';
}

export interface MultiAlgorithmConfig {
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  nodesep: number;
  edgesep: number;
  ranksep: number;
  theme: GraphTheme;
  animationDuration?: number;
  strategy: LayoutStrategy;
  // Force-directed specific options
  forceDirected?: {
    iterations: number;
    strength: number;
    distance: number;
    damping: number;
  };
  // Grid specific options
  grid?: {
    cellSize: number;
    padding: number;
  };
}

export interface LayoutResult {
  nodes: DependencyNode[];
  edges: Edge[];
}

/**
 * Enhanced layout engine that uses different algorithms for different node types
 */
export class MultiAlgorithmLayoutEngine {
  private config: MultiAlgorithmConfig;
  private nodeMap = new Map<string, DependencyNode>();

  constructor(config: MultiAlgorithmConfig) {
    this.config = config;
  }

  /**
   * Apply multi-algorithm layout to the graph
   */
  public applyLayout(nodes: DependencyNode[], edges: Edge[], dagreLib: typeof dagre): LayoutResult {
    this.nodeMap.clear();

    // Separate nodes by type
    const nodeGroups = this.separateNodesByType(nodes);

    // Apply different algorithms based on strategy
    this.layoutPackages(nodeGroups.packages, edges, dagreLib);
    this.layoutModules(nodeGroups.modules, edges, dagreLib);
    this.layoutGroups(nodeGroups.groups, edges, dagreLib);
    this.layoutClasses(nodeGroups.classes, edges, dagreLib);
    this.layoutInterfaces(nodeGroups.interfaces, edges, dagreLib);
    this.layoutLeafNodes(nodeGroups.leafNodes, edges, dagreLib);

    // Ensure all nodes are positioned
    const allNodes = Array.from(this.nodeMap.values());
    return { nodes: allNodes, edges };
  }

  /**
   * Separate nodes by type for different layout strategies
   */
  private separateNodesByType(nodes: DependencyNode[]) {
    return {
      packages: nodes.filter((n) => n.type === 'package'),
      modules: nodes.filter((n) => n.type === 'module'),
      groups: nodes.filter((n) => n.type === 'group'),
      classes: nodes.filter((n) => n.type === 'class'),
      interfaces: nodes.filter((n) => n.type === 'interface'),
      leafNodes: nodes.filter((n) => !['package', 'module', 'group', 'class', 'interface'].includes(n.type ?? '')),
    };
  }

  /**
   * Layout packages using the specified strategy
   */
  private layoutPackages(packages: DependencyNode[], edges: Edge[], dagreLib: typeof dagre): void {
    if (packages.length === 0) return;

    switch (this.config.strategy.packages) {
      case 'force-directed':
        this.applyForceDirectedLayout(packages, edges);
        break;
      case 'hierarchical':
        this.applyHierarchicalLayout(packages, edges, dagreLib);
        break;
      case 'circular':
        this.applyCircularLayout(packages);
        break;
    }
  }

  /**
   * Layout modules using the specified strategy
   */
  private layoutModules(modules: DependencyNode[], edges: Edge[], dagreLib: typeof dagre): void {
    if (modules.length === 0) return;

    switch (this.config.strategy.modules) {
      case 'hierarchical':
        this.applyHierarchicalLayout(modules, edges, dagreLib);
        break;
      case 'grid':
        this.applyGridLayout(modules);
        break;
      case 'force-directed':
        this.applyForceDirectedLayout(modules, edges);
        break;
    }
  }

  /**
   * Layout groups using the specified strategy
   */
  private layoutGroups(groups: DependencyNode[], edges: Edge[], dagreLib: typeof dagre): void {
    if (groups.length === 0) return;

    switch (this.config.strategy.groups) {
      case 'hierarchical':
        this.applyHierarchicalLayout(groups, edges, dagreLib);
        break;
      case 'grid':
        this.applyGridLayout(groups);
        break;
    }
  }

  /**
   * Layout classes using the specified strategy
   */
  private layoutClasses(classes: DependencyNode[], edges: Edge[], dagreLib: typeof dagre): void {
    if (classes.length === 0) return;

    switch (this.config.strategy.classes) {
      case 'grid':
        this.applyGridLayout(classes);
        break;
      case 'hierarchical':
        this.applyHierarchicalLayout(classes, edges, dagreLib);
        break;
      case 'force-directed':
        this.applyForceDirectedLayout(classes, edges);
        break;
    }
  }

  /**
   * Layout interfaces using the specified strategy
   */
  private layoutInterfaces(interfaces: DependencyNode[], edges: Edge[], dagreLib: typeof dagre): void {
    if (interfaces.length === 0) return;

    switch (this.config.strategy.interfaces) {
      case 'grid':
        this.applyGridLayout(interfaces);
        break;
      case 'hierarchical':
        this.applyHierarchicalLayout(interfaces, edges, dagreLib);
        break;
    }
  }

  /**
   * Layout leaf nodes using hierarchical approach
   */
  private layoutLeafNodes(leafNodes: DependencyNode[], edges: Edge[], dagreLib: typeof dagre): void {
    if (leafNodes.length === 0) return;

    // Group by parent and layout within each parent
    const nodesByParent = new Map<string, DependencyNode[]>();
    const orphanNodes: DependencyNode[] = [];

    leafNodes.forEach((node) => {
      const parentId = node.parentNode;
      if (parentId) {
        if (!nodesByParent.has(parentId)) {
          nodesByParent.set(parentId, []);
        }
        nodesByParent.get(parentId)?.push(node);
      } else {
        orphanNodes.push(node);
      }
    });

    // Layout nodes within each parent
    nodesByParent.forEach((children, _parentId) => {
      this.applyHierarchicalLayout(children, edges, dagreLib);
    });

    // Layout orphan nodes
    if (orphanNodes.length > 0) {
      this.applyHierarchicalLayout(orphanNodes, edges, dagreLib);
    }
  }

  /**
   * Apply hierarchical layout using Dagre
   */
  private applyHierarchicalLayout(nodes: DependencyNode[], edges: Edge[], dagreLib: typeof dagre): void {
    const g = new dagreLib.graphlib.Graph({ directed: true, compound: true });

    g.setGraph({
      rankdir: this.config.direction,
      nodesep: this.config.nodesep,
      edgesep: this.config.edgesep,
      ranksep: this.config.ranksep,
      marginx: 50,
      marginy: 50,
    });

    g.setDefaultNodeLabel(() => ({}));
    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes with dimensions
    nodes.forEach((node) => {
      const dims = this.getNodeDimensions(node);
      g.setNode(node.id, dims);
    });

    // Add parent-child relationships
    nodes.forEach((node) => {
      if (node.parentNode) {
        g.setParent(node.id, node.parentNode);
      }
    });

    // Add edges
    const nodeIds = new Set(nodes.map((n) => n.id));
    edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .forEach((edge) => {
        const edgeType = (edge.data as { type?: string } | undefined)?.type;
        const minlen = edgeType === 'inheritance' ? 2 : 1;
        g.setEdge(edge.source, edge.target, { minlen });
      });

    // Run layout
    dagreLib.layout(g);

    // Position nodes
    nodes.forEach((node) => {
      const dagreNode = g.node(node.id) as { x: number; y: number; width: number; height: number } | undefined;
      if (dagreNode) {
        this.nodeMap.set(node.id, {
          ...node,
          position: {
            x: dagreNode.x - dagreNode.width / 2,
            y: dagreNode.y - dagreNode.height / 2,
          },
        });
      }
    });
  }

  /**
   * Apply force-directed layout algorithm
   */
  private applyForceDirectedLayout(nodes: DependencyNode[], edges: Edge[]): void {
    const forceConfig = this.config.forceDirected ?? {
      iterations: 100,
      strength: 0.1,
      distance: 200,
      damping: 0.8,
    };

    // Initialize positions
    const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
    nodes.forEach((node, index) => {
      positions.set(node.id, {
        x: (index % 10) * 200,
        y: Math.floor(index / 10) * 200,
        vx: 0,
        vy: 0,
      });
    });

    // Force-directed simulation
    for (let i = 0; i < forceConfig.iterations; i++) {
      // Calculate forces
      const forces = new Map<string, { fx: number; fy: number }>();

      nodes.forEach((node) => {
        forces.set(node.id, { fx: 0, fy: 0 });
      });

      // Repulsion forces between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];
          if (!node1 || !node2) continue;

          const pos1 = positions.get(node1.id);
          const pos2 = positions.get(node2.id);
          if (!pos1 || !pos2) continue;

          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = forceConfig.strength / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          const force1 = forces.get(node1.id);
          const force2 = forces.get(node2.id);
          if (force1 && force2) {
            force1.fx += fx;
            force1.fy += fy;
            force2.fx -= fx;
            force2.fy -= fy;
          }
        }
      }

      // Attraction forces for connected nodes
      edges.forEach((edge) => {
        const sourcePos = positions.get(edge.source);
        const targetPos = positions.get(edge.target);
        if (sourcePos && targetPos) {
          const dx = targetPos.x - sourcePos.x;
          const dy = targetPos.y - sourcePos.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = (distance - forceConfig.distance) * 0.01;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          const sourceForce = forces.get(edge.source);
          const targetForce = forces.get(edge.target);
          if (sourceForce) {
            sourceForce.fx += fx;
            sourceForce.fy += fy;
          }
          if (targetForce) {
            targetForce.fx -= fx;
            targetForce.fy -= fy;
          }
        }
      });

      // Update positions
      positions.forEach((pos, nodeId) => {
        const force = forces.get(nodeId);
        if (!force) return;
        pos.vx = (pos.vx + force.fx) * forceConfig.damping;
        pos.vy = (pos.vy + force.fy) * forceConfig.damping;
        pos.x += pos.vx;
        pos.y += pos.vy;
      });
    }

    // Apply final positions
    nodes.forEach((node) => {
      const pos = positions.get(node.id);
      if (!pos) return;
      this.nodeMap.set(node.id, {
        ...node,
        position: { x: pos.x, y: pos.y },
      });
    });
  }

  /**
   * Apply grid layout algorithm
   */
  private applyGridLayout(nodes: DependencyNode[]): void {
    const gridConfig = this.config.grid ?? {
      cellSize: 300,
      padding: 50,
    };

    const cols = Math.ceil(Math.sqrt(nodes.length));

    nodes.forEach((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const x = col * gridConfig.cellSize + gridConfig.padding;
      const y = row * gridConfig.cellSize + gridConfig.padding;

      this.nodeMap.set(node.id, {
        ...node,
        position: { x, y },
      });
    });
  }

  /**
   * Apply circular layout algorithm
   */
  private applyCircularLayout(nodes: DependencyNode[]): void {
    const centerX = 400;
    const centerY = 400;
    const radius = Math.max(200, nodes.length * 20);

    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      this.nodeMap.set(node.id, {
        ...node,
        position: { x, y },
      });
    });
  }

  /**
   * Get node dimensions with fallbacks
   */
  private getNodeDimensions(node: DependencyNode): { width: number; height: number } {
    const nodeWithMeasured = node as unknown as { measured?: { width?: number; height?: number } };
    const measured = nodeWithMeasured.measured;
    if (measured?.width !== undefined && measured.height !== undefined) {
      return { width: measured.width, height: measured.height };
    }

    if (typeof node.width === 'number' && typeof node.height === 'number') {
      return { width: node.width, height: node.height };
    }

    const typeDefaults: Record<string, { width: number; height: number }> = {
      package: { width: 600, height: 400 },
      module: { width: 300, height: 200 },
      group: { width: 400, height: 300 },
      class: { width: 280, height: 120 },
      interface: { width: 280, height: 120 },
      enum: { width: 200, height: 100 },
      type: { width: 200, height: 80 },
    };

    const nodeType = String(node.type);
    const defaultDims = typeDefaults[nodeType];
    return defaultDims ?? { width: 280, height: 100 };
  }
}

/**
 * Factory function to create a multi-algorithm layout engine
 */
export function createMultiAlgorithmLayoutEngine(config: MultiAlgorithmConfig): MultiAlgorithmLayoutEngine {
  return new MultiAlgorithmLayoutEngine(config);
}

/**
 * Default layout strategies for different scenarios
 */
export const DEFAULT_STRATEGIES = {
  balanced: {
    packages: 'hierarchical' as const,
    modules: 'hierarchical' as const,
    classes: 'grid' as const,
    interfaces: 'grid' as const,
    groups: 'hierarchical' as const,
  },
  performance: {
    packages: 'circular' as const,
    modules: 'grid' as const,
    classes: 'grid' as const,
    interfaces: 'grid' as const,
    groups: 'grid' as const,
  },
  detailed: {
    packages: 'force-directed' as const,
    modules: 'force-directed' as const,
    classes: 'hierarchical' as const,
    interfaces: 'hierarchical' as const,
    groups: 'hierarchical' as const,
  },
} as const;
